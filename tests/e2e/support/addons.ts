import { test } from '@playwright/test'
import { AyonApi } from './api'

type AddonOptions = {
  /** also skip when the server's license does not include the addon (e.g. powerpack) */
  license?: boolean
  /** skip when the production version is older, e.g. '1.3.0' */
  minVersion?: string
}

type ServerAddons = { production: Record<string, string>; licensed: string[] }

// one lookup per worker; bundles and licenses do not change during a run
let serverAddons: Promise<ServerAddons> | undefined

const loadServerAddons = async (api: AyonApi): Promise<ServerAddons> => {
  const { addons } = await api.get('/api/addons')
  const production: Record<string, string> = {}
  for (const addon of addons)
    if (addon.productionVersion) production[addon.name] = addon.productionVersion
  const info = await api.get('/api/info')
  return { production, licensed: decodeExtras(info.extras) }
}

// `extras` in /api/info is base64url of the license's feature list, each byte XOR 42
const decodeExtras = (extras: unknown): string[] => {
  if (typeof extras !== 'string' || !extras) return []
  try {
    const bytes = Buffer.from(extras, 'base64url').map((b) => b ^ 42)
    const features = JSON.parse(Buffer.from(bytes).toString('utf8'))
    return Array.isArray(features) ? features : []
  } catch {
    return []
  }
}

const isOlder = (version: string, min: string) => {
  const parse = (v: string) =>
    v
      .split(/[.-]/)
      .slice(0, 3)
      .map((n) => parseInt(n, 10) || 0)
  const [a, b] = [parse(version), parse(min)]
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i]
  return false
}

/** Why the addon can't be tested on this server, or undefined when it can */
export const addonUnavailable = async (
  api: AyonApi,
  name: string,
  options: AddonOptions = {},
): Promise<string | undefined> => {
  serverAddons ??= loadServerAddons(api)
  const { production, licensed } = await serverAddons
  const version = production[name]
  if (!version) return `needs the ${name} addon in the production bundle`
  if (options.minVersion && isOlder(version, options.minVersion))
    return `needs ${name} ${options.minVersion} or newer (production has ${version})`
  if (options.license && !licensed.includes(name)) return `needs a ${name} license`
  return undefined
}

/**
 * Skips the current test (or every test, from `beforeEach`) unless the addon is in the production
 * bundle, and optionally licensed and recent enough. Returns the production version.
 */
export const requireAddon = async (api: AyonApi, name: string, options: AddonOptions = {}) => {
  const reason = await addonUnavailable(api, name, options)
  test.skip(!!reason, reason)
  return (await serverAddons!).production[name]
}
