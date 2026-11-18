// Developing addons inside the real frontend: `?addonDev=<addon>@http://localhost:5173` loads
// that addon from the addon's dev server (`ayon-addon dev --ayon`) instead of the server, kept in
// localStorage until `?addonDev=off`. Several addons: comma separated
// (`?addonDev=a@http://localhost:5173,b@http://localhost:5174`) or the parameter repeated. Only for developer-mode and service users, only from this
// machine. When one of these doesn't hold, the reason is shown in the dev banner (never only in the
// console). See src/remote/AGENTS.md.

export const ADDON_DEV_PARAM = 'addonDev'
const STORAGE_KEY = 'ayon-addon-dev'
const INFO_TIMEOUT_MS = 5000
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

/** The entries of every ?addonDev= parameter: repeated, or comma separated. */
export const splitAddonDevParams = (values: string[]) =>
  values
    .flatMap((value) => value.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)

/** One request per entry; a later entry for the same addon replaces an earlier one. */
export const parseAddonDevParams = (values: string[]): AddonDevRequest[] => {
  const requests: AddonDevRequest[] = []
  for (const entry of splitAddonDevParams(values)) {
    const request = parseAddonDevParam(entry)
    if ('override' in request) {
      const same = requests.findIndex(
        (other) => 'override' in other && other.override.addon === request.override.addon,
      )
      if (same >= 0) requests.splice(same, 1)
    }
    requests.push(request)
  }
  return requests
}

/** The stored overrides; a single one from before several were supported is read too. */
export const readStoredAddonDevOverrides = (
  storage: Storage = localStorage,
): AddonDevOverride[] => {
  try {
    const stored = JSON.parse(storage.getItem(STORAGE_KEY) || 'null')
    const list: unknown[] = Array.isArray(stored) ? stored : stored ? [stored] : []
    return list.filter(
      (item): item is AddonDevOverride =>
        !!item &&
        typeof (item as AddonDevOverride).addon === 'string' &&
        typeof (item as AddonDevOverride).url === 'string' &&
        isLocalDevUrl((item as AddonDevOverride).url),
    )
  } catch {
    return []
  }
}

export const storeAddonDevOverrides = (
  overrides: AddonDevOverride[],
  storage: Storage = localStorage,
) => {
  if (overrides.length) storage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  else storage.removeItem(STORAGE_KEY)
}

/**
 * The overrides from the URL (stored for later, replacing the stored ones) or from a previous page.
 * `?addonDev=off` clears them all.
 */
export const readAddonDevRequests = (
  search: string = window.location.search,
  storage: Storage = localStorage,
): AddonDevRequest[] => {
  const params = new URLSearchParams(search).getAll(ADDON_DEV_PARAM)
  if (params.length && (params.includes('off') || !splitAddonDevParams(params).length)) {
    storeAddonDevOverrides([], storage)
    return []
  }
  if (params.length) {
    const requests = parseAddonDevParams(params)
    const overrides = requests.flatMap((request) =>
      'override' in request ? [request.override] : [],
    )
    // a URL with no valid entry keeps the stored ones for the next page, as with a single one
    if (overrides.length) storeAddonDevOverrides(overrides, storage)
    for (const request of requests) {
      if ('reason' in request)
        console.warn(
          `[addon dev] ignored ?${ADDON_DEV_PARAM}=${request.request}: ${request.reason}`,
        )
    }
    return requests
  }
  return readStoredAddonDevOverrides(storage).map((override) => ({ override }))
}

/** The request as written in the URL, the banner row's key. */
export const addonDevRequestKey = (request: AddonDevRequest) =>
  'override' in request ? `${request.override.addon}@${request.override.url}` : request.request

/** The key of a banner row: an override's request, or the rejected request as given. */
export const addonDevStateKey = (state: { override: AddonDevOverride } | { request: string }) =>
  'override' in state ? addonDevRequestKey({ override: state.override }) : state.request

/**
 * Drops one entry (by its key) from the stored overrides and returns the ?addonDev= value without
 * it (null: no entry left), so the other addons stay loaded.
 */
export const removeAddonDevEntry = (
  key: string,
  params: string[],
  storage: Storage = localStorage,
): string | null => {
  const removed = parseAddonDevParam(key)
  const addon = 'override' in removed ? removed.override.addon : undefined
  storeAddonDevOverrides(
    readStoredAddonDevOverrides(storage).filter((override) => override.addon !== addon),
    storage,
  )
  const rest = splitAddonDevParams(params).filter((entry) => {
    if (entry === key) return false
    const request = parseAddonDevParam(entry)
    return !(addon && 'override' in request && request.override.addon === addon)
  })
  return rest.length ? rest.join(',') : null
}

/** Why /ayon-addon.json can't be used for this override, or null when it can. */
export const addonDevInfoProblem = (
  info: unknown,
  { addon, url }: AddonDevOverride,
): string | null => {
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
    return `${url}/ayon-addon.json is invalid (no ${missing.join(
      ', ',
    )}): is it served by \`ayon-addon dev --ayon\`?`
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
    // bounded: the remotes of every addon wait for this answer
    response = await fetch(`${url}/ayon-addon.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(INFO_TIMEOUT_MS),
    })
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
    throw new Error(
      `${url}/ayon-addon.json is not JSON: is it served by \`ayon-addon dev --ayon\`?`,
    )
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
