// `ayon-addon dev --ayon`: what AYON's dev override needs that the CLI can check against the server.
// The page ignores the override (and says why in its banner) when one of these doesn't hold, and an
// addon whose server version isn't installed loads, but its endpoint calls answer 404.
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import type { AddonProject, AyonConnection } from './project.js'

export interface DevCheck {
  id: 'server' | 'apiKey' | 'user' | 'addon' | 'addonVersion'
  ok: boolean
  /** error: the addon won't work in AYON; warning: it may, or it couldn't be checked */
  severity?: 'error' | 'warning'
  message: string
  /** how to fix it, when it failed */
  fix?: string
}

interface CheckOptions {
  project: AddonProject
  connection: AyonConnection
  /** ayonAddon({ rest: { versionModule } }), relative to the addon's frontend folder */
  versionModule?: string
  fetch?: typeof globalThis.fetch
}

// the version the addon's frontend calls its endpoints with: the default export of its versionModule
// (src/addonVersion.ts unless configured, see generate-rest)
export const readFrontendVersion = (root: string, versionModule = 'src/addonVersion.ts') => {
  const full = path.resolve(root, versionModule)
  if (!existsSync(full)) return undefined
  const version = readFileSync(full, 'utf8').match(/export default\s+["']([^"']+)["']/)?.[1]
  return version ? { file: versionModule, version } : undefined
}

// the addon has server code: a missing server version breaks its endpoints, not only its settings
const hasServerCode = (root: string) => existsSync(path.resolve(root, '..', 'server'))

const INSTALL_FIX = (name: string, version: string) =>
  `install ${name} ${version} on the server: build it (python create_package.py in the addon) and upload the zip in Studio settings > Addons > Upload Addons` +
  ` (AYON dev workbench: scripts/mani.sh run addon-install -p <repo> SRC=<worktree>)`

export const checkDevRequirements = async ({
  project,
  connection,
  versionModule,
  fetch = globalThis.fetch,
}: CheckOptions): Promise<DevCheck[]> => {
  const { serverUrl, apiKey, apiKeySource } = connection
  const checks: DevCheck[] = []
  const headers: Record<string, string> = apiKey ? { 'x-api-key': apiKey } : {}
  const get = async (urlPath: string) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    try {
      const response = await fetch(`${serverUrl}${urlPath}`, { headers, signal: controller.signal })
      return { status: response.status, body: response.ok ? await response.json() : undefined }
    } finally {
      clearTimeout(timer)
    }
  }

  // the server
  try {
    const { status, body } = await get('/api/info')
    if (status !== 200) {
      checks.push({
        id: 'server',
        ok: false,
        severity: 'error',
        message: `AYON at ${serverUrl} answered ${status} to /api/info`,
        fix: 'check the server log; set AYON_SERVER_URL if this is the wrong server',
      })
      return checks
    }
    const version = body?.version ? ` ${body.version}` : ''
    checks.push({ id: 'server', ok: true, message: `AYON${version} at ${serverUrl}` })
  } catch {
    checks.push({
      id: 'server',
      ok: false,
      severity: 'error',
      message: `AYON at ${serverUrl} doesn't answer`,
      fix: 'start the server, or point AYON_SERVER_URL at a running one',
    })
    return checks
  }

  if (!apiKey) {
    checks.push({
      id: 'apiKey',
      ok: false,
      severity: 'warning',
      message: "no API key: can't check the user or the installed addon versions",
      fix: "set AYON_API_KEY (a service user's key) to check them",
    })
    return checks
  }

  // the key's user: what an agent's headless browser signs in as
  const me = await get('/api/users/me').catch(() => ({ status: 0, body: undefined }))
  if (me.status !== 200) {
    checks.push({
      id: 'user',
      ok: false,
      severity: 'error',
      message: `the API key from ${apiKeySource} was rejected (${me.status || 'no answer'})`,
      fix: "set AYON_API_KEY to a valid service user's key",
    })
    return checks
  }
  const user = me.body as { name: string; attrib?: { developerMode?: boolean }; data?: { isService?: boolean } }
  if (user.data?.isService || user.attrib?.developerMode) {
    checks.push({
      id: 'user',
      ok: true,
      message: `${user.name} (the key's user) may use the override: ${
        user.data?.isService ? 'a service user' : 'developer mode is on'
      }. In a browser, your own user needs developer mode`,
    })
  } else {
    checks.push({
      id: 'user',
      ok: false,
      severity: 'warning',
      message: `${user.name} (the key's user) is not in developer mode: a page signed in with this key ignores the override`,
      fix: "turn on developer mode for that user, or use a service user's key",
    })
  }

  // the addon's server side, in the version the frontend calls
  const frontendVersion = readFrontendVersion(project.root, versionModule)
  if (frontendVersion && frontendVersion.version !== project.version) {
    checks.push({
      id: 'addonVersion',
      ok: false,
      severity: 'warning',
      message: `${frontendVersion.file} says ${frontendVersion.version}, package.py says ${project.version}: the frontend calls the endpoints of ${frontendVersion.version}`,
      fix: `set both to the same version (packaging writes ${frontendVersion.file} from package.py)`,
    })
  }
  const version = frontendVersion?.version ?? project.version
  const addons = await get('/api/addons').catch(() => ({ status: 0, body: undefined }))
  const addon = (
    addons.body as { addons?: { name: string; versions: Record<string, { isBroken?: boolean }> }[] } | undefined
  )?.addons?.find((item) => item.name === project.name)
  const severity = hasServerCode(project.root) ? 'error' : 'warning'
  const effect = `the page loads its frontend from here anyway, but calls to /api/addons/${project.name}/${version}/... answer 404`
  if (addons.status !== 200) {
    checks.push({
      id: 'addon',
      ok: false,
      severity: 'warning',
      message: `couldn't list the server's addons (${addons.status || 'no answer'})`,
    })
  } else if (!addon) {
    checks.push({
      id: 'addon',
      ok: false,
      severity,
      message: `${project.name} is not installed on the server: ${effect}`,
      fix: INSTALL_FIX(project.name, version),
    })
  } else if (!addon.versions[version]) {
    checks.push({
      id: 'addon',
      ok: false,
      severity,
      message: `${project.name} ${version} is not installed (the server has ${
        Object.keys(addon.versions).join(', ') || 'none'
      }): ${effect}`,
      fix: INSTALL_FIX(project.name, version),
    })
  } else if (addon.versions[version].isBroken) {
    checks.push({
      id: 'addon',
      ok: false,
      severity: 'error',
      message: `${project.name} ${version} is installed but failed to load on the server: its endpoints don't exist`,
      fix: 'see the server log for the error in its server code',
    })
  } else {
    checks.push({ id: 'addon', ok: true, message: `${project.name} ${version} is installed on the server` })
  }
  return checks
}

export const formatChecks = (checks: DevCheck[]) =>
  checks
    .flatMap((check) => [
      `  ${(check.ok ? 'ok' : check.severity === 'error' ? 'FAIL' : 'warn').padEnd(5)} ${check.message}`,
      ...(check.fix ? [`        fix: ${check.fix}`] : []),
    ])
    .join('\n')
