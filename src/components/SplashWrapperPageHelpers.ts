// Why an addon's page is missing, so its splash screen can say the right thing.
// The splash used to always be the sales dialog, which told studios with a valid
// subscription to subscribe when the addon was only missing from their bundle.

import { useListAddonsQuery } from '@shared/api'
import { useGetBundleAddon } from '@shared/hooks'

export type AddonSplashState =
  // still loading: show no dialog yet, so the sales dialog doesn't flash
  | { status: 'loading' }
  // not installed on this server: the sales dialog
  | { status: 'notInstalled' }
  // installed on the server, but the bundle in use doesn't include it
  | { status: 'notInBundle'; bundleVariant: string; installedVersions: string[] }
  // in the bundle, but its page still isn't there (older version, page failed to load)
  | { status: 'pageUnavailable'; bundleVariant: string; version: string }

export const useAddonSplashState = (addonName?: string): AddonSplashState => {
  const { getBundleAddonVersion, bundleVariant, isLoading: isLoadingBundle } = useGetBundleAddon()
  // same GET /api/addons the remote modules already made, served from the cache
  const { data: addonList, isLoading: isLoadingAddons } = useListAddonsQuery(
    {},
    { skip: !addonName },
  )

  if (!addonName) return { status: 'notInstalled' }
  if (isLoadingBundle || isLoadingAddons) return { status: 'loading' }

  const bundleVersion = getBundleAddonVersion(addonName)
  if (bundleVersion) {
    return { status: 'pageUnavailable', bundleVariant, version: bundleVersion }
  }

  const installed = addonList?.addons.find((addon) => addon.name === addonName)
  const installedVersions = Object.keys(installed?.versions ?? {})
  if (installedVersions.length) {
    return { status: 'notInBundle', bundleVariant, installedVersions }
  }

  return { status: 'notInstalled' }
}
