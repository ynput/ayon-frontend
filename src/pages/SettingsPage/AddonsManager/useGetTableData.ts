import { useMemo } from 'react'
import { transformAddonsTable, transformBundlesTable, transformVersionsTable } from './helpers'

// Type definitions for the hook parameters and return values
interface TableDataItem {
  name?: string
  version?: string
  status: string[]
  tooltip?: string
  suffix?: string
}

interface UseGetTableDataReturn {
  addonsTableData: TableDataItem[]
  versionsTableData: TableDataItem[]
  bundlesTableData: TableDataItem[]
  filteredVersionsMap: Map<string, any>
  versionSort: (sortOrder: number) => (a: TableDataItem, b: TableDataItem) => number
}

const useGetTableData = (
  addonsVersionsBundles: any,
  selectedAddons: string[],
  selectedVersions: string[],
  deletedVersions: string[] = [],
): UseGetTableDataReturn => {
  const addonsTableData = useMemo(
    () => transformAddonsTable(addonsVersionsBundles) as TableDataItem[],
    [addonsVersionsBundles],
  )

  const [filteredVersionsMap, versionsTableData, versionSort] = useMemo(() => {
    const result = transformVersionsTable(
      addonsVersionsBundles,
      selectedAddons,
      deletedVersions,
    ) as [
      Map<string, any>,
      TableDataItem[],
      (sortOrder: number) => (a: TableDataItem, b: TableDataItem) => number,
    ]
    return result
  }, [selectedAddons, addonsVersionsBundles, deletedVersions])

  const bundlesTableData = useMemo(
    () =>
      transformBundlesTable(
        addonsVersionsBundles,
        selectedAddons,
        selectedVersions,
      ) as TableDataItem[],
    [addonsVersionsBundles, selectedAddons, selectedVersions],
  )

  return { addonsTableData, versionsTableData, bundlesTableData, filteredVersionsMap, versionSort }
}

export default useGetTableData

// Export the types for use in other files
export type { UseGetTableDataReturn, TableDataItem }
