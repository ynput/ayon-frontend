import { useListBundlesQuery } from '@queries/bundles/getBundles'

type Props = {
  addon: string
}

const useGetBundleAddonVersion = ({ addon }: Props) => {
  const { data: { bundles, productionBundle, stagingBundle } = {} } = useListBundlesQuery({})

  // get production, staging, dev, latest bundle
  const bundleName = productionBundle || stagingBundle
  const bundleDetails = bundles?.find((b) => b.name === bundleName)

  if (!bundleDetails) return undefined

  const addonVersion = bundleDetails.addons?.[addon]
  if (!addonVersion) return undefined

  return addonVersion
}

export default useGetBundleAddonVersion
