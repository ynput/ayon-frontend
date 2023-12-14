import { Section } from '@ynput/ayon-react-components'
import { useGetAddonListQuery } from '/src/services/addons/getAddons'
import { useGetBundleListQuery } from '/src/services/bundles'
import { useMemo } from 'react'
import transformAddonsWithBundles from './transformAddonsWithBundles'

const AddonsManagerItems = () => {
  const { data: addons = [] } = useGetAddonListQuery()
  const { data: bundles = [] } = useGetBundleListQuery({ archived: false })

  const addonsVersionsBundles = useMemo(
    () => transformAddonsWithBundles(addons, bundles),
    [bundles, addons],
  )

  console.log(addonsVersionsBundles)

  return <Section></Section>
}

export default AddonsManagerItems
