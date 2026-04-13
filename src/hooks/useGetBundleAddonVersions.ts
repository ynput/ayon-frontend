import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { useGlobalContext } from '@shared/context'
import { getFrontendBundleMode } from '@shared/util'

type Props = {
  addons: string[]
}

export const useGetBundleAddonVersions = ({ addons }: Props) => {
  const { user } = useGlobalContext()
  const frontendBundleMode = getFrontendBundleMode(user)
  const { data: { bundles, productionBundle, stagingBundle } = {}, isFetching } =
    useListBundlesQuery({})

  if (isFetching) return { isLoading: true, addonVersions: new Map<string, string>() }

  const userName = user?.name
  const activeDevBundle = bundles?.find((bundle) => bundle.isDev && bundle.activeUser === userName)?.name
  const bundleName =
    frontendBundleMode === 'developer'
      ? activeDevBundle || stagingBundle || productionBundle
      : frontendBundleMode === 'staging'
        ? stagingBundle || productionBundle
        : productionBundle || stagingBundle
  const bundleDetails = bundles?.find((b) => b.name === bundleName)

  // always return a map, even if no bundle details are found
  if (!bundleDetails) return { isLoading: false, addonVersions: new Map<string, string>() }

  const result = new Map<string, string>()
  addons.forEach((addon) => {
    // check if the addon exists in the bundle
    if (bundleDetails.addons?.[addon] !== undefined) {
      // if it exists, add it to the result map
      result.set(addon, bundleDetails.addons?.[addon])
    }
  })

  return { isLoading: false, addonVersions: result }
}

export default useGetBundleAddonVersions
