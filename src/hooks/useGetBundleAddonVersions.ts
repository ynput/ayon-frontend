import { useListBundlesQuery } from '@queries/bundles/getBundles'

type Props = {
  addons: string[]
}

export const useGetBundleAddonVersions = ({ addons }: Props) => {
  const { data: { bundles, productionBundle, stagingBundle } = {}, isFetching } =
    useListBundlesQuery({})

  if (isFetching) return { isLoading: true, addonVersions: new Map<string, string>() }

  // get production, staging, dev, latest bundle
  const bundleName = productionBundle || stagingBundle
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
