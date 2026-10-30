import { addonDev } from './env'

let devVersion: Promise<string> | undefined

const requireAddonDev = () => {
  const dev = addonDev()
  if (!dev) throw new Error('Not an addon suite: pass `addon` to ayonConfig() in playwright.config.ts')
  return dev
}

/** the version of the addon under test that `ayon-addon dev --ayon` serves (its ayon-addon.json) */
export const addonDevVersion = () => {
  const { url } = requireAddonDev()
  devVersion ??= fetch(`${url}/ayon-addon.json`)
    .then((res) => res.json())
    .then((info: { version: string }) => info.version)
  return devVersion
}

/** `/api/addons/<addon>/<version><path>`: an endpoint of the addon under test, at the version AYON loads */
export const addonEndpoint = async (path: string) =>
  `/api/addons/${requireAddonDev().addon}/${await addonDevVersion()}${path}`
