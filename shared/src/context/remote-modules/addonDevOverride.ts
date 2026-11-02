// Developing an addon inside the real frontend: `?addonDev=<addon>@http://localhost:5173` loads
// that one addon from the addon's dev server (`ayon-addon dev --ayon`) instead of the server, kept in
// localStorage until `?addonDev=off`. Only for developer-mode and service users, only from this
// machine. When one of these doesn't hold, the reason is shown in the dev banner (never only in the
// console). See src/remote/AGENTS.md.

export const ADDON_DEV_PARAM = 'addonDev'
const STORAGE_KEY = 'ayon-addon-dev'
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']
const USAGE = `use ?${ADDON_DEV_PARAM}=<addon>@http://localhost:<port>`

export interface AddonDevOverride {
  addon: string
  url: string
}

/** What `ayon-addon dev --ayon` serves as /ayon-addon.json next to the build. */
export interface AddonDevInfo {
  name: string
  version: string
  remote: string
  modules: string[]
  /** changes on every rebuild */
  buildId: string
}

/** The override asked for, or why it can't be used: shown in the banner. */
export type AddonDevRequest = { override: AddonDevOverride } | { request: string; reason: string }

export const isLocalDevUrl = (url: string) => {
  try {
    const { protocol, hostname } = new URL(url)
    return ['http:', 'https:'].includes(protocol) && LOCAL_HOSTS.includes(hostname)
  } catch {
    return false
  }
}

/** `<addon>@<url>` from the URL parameter, or why it is not a valid override. */
export const parseAddonDevParam = (value: string): AddonDevRequest => {
  const at = value.indexOf('@')
  if (at <= 0) return { request: value, reason: USAGE }
  const addon = value.slice(0, at)
  const url = value.slice(at + 1).replace(/\/+$/, '')
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { request: value, reason: `"${url}" is not a URL: ${USAGE}` }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { request: value, reason: `the dev server URL must be http(s): ${USAGE}` }
  }
  if (!isLocalDevUrl(url)) {
    return {
      request: value,
      reason: `${parsed.hostname} is not this machine: only dev servers on localhost, 127.0.0.1 or [::1] can be loaded`,
    }
  }
  return { override: { addon, url } }
}

/** The override from the URL (stored for later) or from a previous page. */
export const readAddonDevRequest = (): AddonDevRequest | null => {
  const param = new URLSearchParams(window.location.search).get(ADDON_DEV_PARAM)
  if (param === 'off' || param === '') {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
  if (param) {
    const request = parseAddonDevParam(param)
    if ('override' in request) localStorage.setItem(STORAGE_KEY, JSON.stringify(request.override))
    else console.warn(`[addon dev] ignored ?${ADDON_DEV_PARAM}=${param}: ${request.reason}`)
    return request
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return stored && isLocalDevUrl(stored.url) ? { override: stored } : null
  } catch {
    return null
  }
}

export const clearAddonDevOverride = () => localStorage.removeItem(STORAGE_KEY)

/** Why /ayon-addon.json can't be used for this override, or null when it can. */
export const addonDevInfoProblem = (info: unknown, { addon, url }: AddonDevOverride): string | null => {
  const value = (info ?? {}) as Partial<Record<keyof AddonDevInfo, unknown>>
  const missing: string[] = (['name', 'version', 'remote', 'buildId'] as const).filter(
    (key) => typeof value[key] !== 'string' || !value[key],
  )
  if (
    !Array.isArray(value.modules) ||
    value.modules.some((module) => typeof module !== 'string' || !module)
  ) {
    missing.push('modules')
  }
  if (typeof info !== 'object' || !info || missing.length) {
    return `${url}/ayon-addon.json is invalid (no ${missing.join(', ')}): is it served by \`ayon-addon dev --ayon\`?`
  }
  if (value.name !== addon) {
    return `the dev server at ${url} serves "${value.name}", not "${addon}": open ?${ADDON_DEV_PARAM}=${value.name}@${url}`
  }
  return null
}

export const fetchAddonDevInfo = async (override: AddonDevOverride): Promise<AddonDevInfo> => {
  const { url } = override
  let response: Response
  try {
    response = await fetch(`${url}/ayon-addon.json`, { cache: 'no-store' })
  } catch {
    throw new Error(`no answer from ${url}: is \`ayon-addon dev --ayon\` running on that port?`)
  }
  if (response.status === 404) {
    throw new Error(
      `${url} has no /ayon-addon.json: run \`ayon-addon dev --ayon\` (not the dev shell) and wait for its first build`,
    )
  }
  if (!response.ok) throw new Error(`${url}/ayon-addon.json answered ${response.status}`)
  let info: unknown
  try {
    info = await response.json()
  } catch {
    throw new Error(`${url}/ayon-addon.json is not JSON: is it served by \`ayon-addon dev --ayon\`?`)
  }
  const problem = addonDevInfoProblem(info, override)
  if (problem) throw new Error(problem)
  return info as AddonDevInfo
}

type DevUser = {
  attrib?: { developerMode?: boolean }
  data?: { isService?: boolean; isDeveloper?: boolean }
}

/** Why this user may not load addon code from their machine, or null when they may. */
export const addonDevUserProblem = (user: DevUser | undefined): string | null => {
  if (user?.attrib?.developerMode || user?.data?.isService) return null
  return user?.data?.isDeveloper
    ? 'only users in developer mode can load addons from a dev server: turn on Developer Mode in the header, then reload'
    : 'only users in developer mode can load addons from a dev server, and this user is not a developer: an admin can turn on Developer in Studio settings > Users'
}

/** May this user load addon code from their machine? */
export const canUseAddonDevOverride = (user: DevUser | undefined) => !addonDevUserProblem(user)
