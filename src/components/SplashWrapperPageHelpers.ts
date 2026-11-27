// Why an addon's page is missing, so its splash screen can say the right thing.
// The splash used to always be the sales dialog, which told studios with a valid
// subscription to subscribe when the addon was only missing from their bundle.

import { useListAddonsQuery } from '@shared/api'
import { useGetBundleAddon } from '@shared/hooks'

export type AddonSplashState =
  // still loading: show no dialog yet, so the sales dialog doesn't flash
  | { status: 'loading' }
  // the addon list failed to load, so we can't tell whether the addon is installed:
  // a neutral retry, never the sales dialog
  | { status: 'lookupFailed'; bundleVariant: string; retry: () => void }
  // not installed on this server: the sales dialog
  | { status: 'notInstalled' }
  // installed on the server, but the bundle in use doesn't include it
  | { status: 'notInBundle'; bundleVariant: string; installedVersions: string[] }
  // in the bundle, but its page still isn't there (older version, page failed to load)
  | { status: 'pageUnavailable'; bundleVariant: string; version: string }

export const useAddonSplashState = (addonName?: string): AddonSplashState => {
  const { getBundleAddonVersion, bundleVariant, isLoading: isLoadingBundle } = useGetBundleAddon()
  // same GET /api/addons the remote modules already made, served from the cache
  const {
    data: addonList,
    isError: isAddonsError,
    refetch: refetchAddons,
  } = useListAddonsQuery({}, { skip: !addonName })

  if (!addonName) return { status: 'notInstalled' }
  if (isLoadingBundle) return { status: 'loading' }

  const bundleVersion = getBundleAddonVersion(addonName)
  if (bundleVersion) {
    return { status: 'pageUnavailable', bundleVariant, version: bundleVersion }
  }

  // "not installed" only from a list that loaded: a failed request says nothing about the addon
  if (!addonList) {
    return isAddonsError
      ? { status: 'lookupFailed', bundleVariant, retry: refetchAddons }
      : { status: 'loading' }
  }

  const installed = addonList.addons.find((addon) => addon.name === addonName)
  const installedVersions = Object.keys(installed?.versions ?? {})
  if (installedVersions.length) {
    return { status: 'notInBundle', bundleVariant, installedVersions }
  }

  return { status: 'notInstalled' }
}

type UnavailableState = Extract<
  AddonSplashState,
  { status: 'notInBundle' | 'pageUnavailable' | 'lookupFailed' }
>

// the AddonUnavailableDialog's wording for each state
export const getAddonUnavailableText = (
  state: UnavailableState,
  addonName: string,
  title: string,
  isAdmin: boolean,
): { heading: string; explanation: string; nextStep: string } => {
  const bundle = `${state.bundleVariant} bundle`

  switch (state.status) {
    case 'notInBundle':
      return {
        heading: `The ${addonName} addon is not active in the ${bundle}`,
        explanation: `The ${addonName} addon is installed on this server, but the ${bundle} does not include it, so ${title} is not available.`,
        nextStep: isAdmin
          ? `Add ${addonName} to the ${bundle} in Bundles settings, then reload the page.`
          : `Ask your AYON administrator to add ${addonName} to the ${bundle}.`,
      }
    case 'pageUnavailable':
      return {
        heading: `The ${addonName} addon did not load`,
        explanation: `The ${bundle} includes ${addonName} ${state.version}, but ${title} could not be loaded. The addon version may be too old for this AYON version, or its frontend failed to load.`,
        nextStep: isAdmin
          ? `Reload the page. If ${title} still does not load, check the ${addonName} version in the bundle or contact support.`
          : `Reload the page. If ${title} still does not load, contact your AYON administrator.`,
      }
    case 'lookupFailed':
      return {
        heading: `Could not check the ${addonName} addon`,
        explanation: `AYON could not load the list of installed addons, so it cannot tell whether ${title} is available.`,
        nextStep: isAdmin
          ? 'Try again. If this keeps happening, check that the server is reachable and its addons are healthy.'
          : 'Try again. If this keeps happening, contact your AYON administrator.',
      }
  }
}
