import { useMemo } from 'react'
import { transformAddonsTable, transformBundlesTable, transformVersionsTable } from './helpers'

const useGetTableData = (
  addonsVersionsBundles,
  selectedAddons,
  selectedVersions,
  deletedVersions = [],
) => {
  const addonsTableData = useMemo(
    () => transformAddonsTable(addonsVersionsBundles),
    [addonsVersionsBundles],
  )

  const [filteredVersionsMap, versionsTableData, versionSort] = useMemo(
    () => transformVersionsTable(addonsVersionsBundles, selectedAddons, deletedVersions),
    [selectedAddons, addonsVersionsBundles, deletedVersions],
  )

  const bundlesTableData = useMemo(
    () => transformBundlesTable(addonsVersionsBundles, selectedAddons, selectedVersions),
    [addonsVersionsBundles, selectedAddons, selectedVersions],
  )

  return { addonsTableData, versionsTableData, bundlesTableData, filteredVersionsMap, versionSort }
}

export default useGetTableData
