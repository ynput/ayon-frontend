// Developing an addon inside the real frontend: `?addonDev=<addon>@http://localhost:5173` loads
// that one addon from the addon's dev server (`ayon-addon dev --ayon`) instead of the server, kept in
// localStorage until `?addonDev=off`. Only for developer-mode and service users, only from this
// machine. See src/remote/AGENTS.md.

export const ADDON_DEV_PARAM = 'addonDev'
const STORAGE_KEY = 'ayon-addon-dev'
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

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

export const isLocalDevUrl = (url: string) => {
  try {
    const { protocol, hostname } = new URL(url)
    return ['http:', 'https:'].includes(protocol) && LOCAL_HOSTS.includes(hostname)
  } catch {
    return false
  }
}

const parse = (value: string): AddonDevOverride | null => {
  const at = value.indexOf('@')
  if (at <= 0) return null
  const addon = value.slice(0, at)
  const url = value.slice(at + 1).replace(/\/+$/, '')
  return isLocalDevUrl(url) ? { addon, url } : null
}

/** The override from the URL (stored for later) or from a previous page. */
export const readAddonDevOverride = (): AddonDevOverride | null => {
  const param = new URLSearchParams(window.location.search).get(ADDON_DEV_PARAM)
  if (param === 'off' || param === '') {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
  if (param) {
    const override = parse(param)
    if (!override) {
      console.warn(`[addon dev] ignored ?${ADDON_DEV_PARAM}=${param}: use <addon>@http://localhost:<port>`)
      return null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(override))
    return override
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return stored && isLocalDevUrl(stored.url) ? stored : null
  } catch {
    return null
  }
}

export const clearAddonDevOverride = () => localStorage.removeItem(STORAGE_KEY)

export const fetchAddonDevInfo = async ({ url }: AddonDevOverride): Promise<AddonDevInfo> => {
  const response = await fetch(`${url}/ayon-addon.json`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${url}/ayon-addon.json answered ${response.status}`)
  return response.json()
}

/** May this user load addon code from their machine? */
export const canUseAddonDevOverride = (
  user: { attrib?: { developerMode?: boolean }; data?: { isService?: boolean } } | undefined,
) => !!user?.attrib?.developerMode || !!user?.data?.isService
