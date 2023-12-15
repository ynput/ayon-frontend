import { useMemo } from 'react'
import { transformAddonsTable, transformBundlesTable, transformVersionsTable } from './helpers'

const useGetTableData = (addonsVersionsBundles, selectedAddons, selectedVersions) => {
  const addonsTableData = useMemo(
    () => transformAddonsTable(addonsVersionsBundles),
    [addonsVersionsBundles],
  )

  const [filteredVersionsMap, versionsTableData] = useMemo(
    () => transformVersionsTable(addonsVersionsBundles, selectedAddons),
    [selectedAddons, addonsVersionsBundles],
  )

  const bundlesTableData = useMemo(
    () => transformBundlesTable(addonsVersionsBundles, selectedAddons, selectedVersions),
    [addonsVersionsBundles, selectedAddons, selectedVersions],
  )

  return { addonsTableData, versionsTableData, bundlesTableData, filteredVersionsMap }
}

export default useGetTableData
