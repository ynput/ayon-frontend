import { parseRowId, useSelectedRowsContext } from '@shared/containers'
import {
  FC,
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import { VersionsSelectionContext } from './VPSelectionContextInstance'
import { useVersionsDataContext } from './VPDataContextInstance'
import { useVPViewsContext } from './VPViewsContextInstance'

export interface VersionsSelection {
  versionIds: string[]
  productIds: string[]
}

export interface VersionsSelectionContextValue {
  selectedVersions: string[]
  selectedProducts: string[]
  setSelectedVersions: (versionIds: string[]) => void
  showVersionDetails: boolean
  showVersionsTable: boolean
  clearSelection: () => void
  isVersionSelected: (versionId: string) => boolean
  toggleVersionSelection: (versionId: string) => void
}

interface VersionsSelectionProviderProps {
  children: ReactNode
}

export const VersionsSelectionProvider: FC<VersionsSelectionProviderProps> = ({ children }) => {
  const { selectedRows } = useSelectedRowsContext()
  const { entitiesMap } = useVersionsDataContext()
  const { showGrid, showProducts } = useVPViewsContext()

  const selectedRowEntities = useMemo(() => {
    const versions: string[] = []
    const products: string[] = []
    selectedRows.forEach((rowId) => {
      const entityId = parseRowId(rowId)
      const entity = entitiesMap.get(entityId)
      if (entity?.entityType === 'version') {
        versions.push(entityId)
      } else if (entity?.entityType === 'product') {
        products.push(entityId)
      }
    })
    return { versions, products }
  }, [selectedRows, entitiesMap])

  const selectedRowProducts = selectedRowEntities.products
  const selectedRowVersions = selectedRowEntities.versions

  // extract version IDs from selectedRows
  const versions = useMemo(() => {
    const result: string[] = [...selectedRowVersions]

    // when in table and stacked, selected products should use featuredVersion (if no versions are already selected)
    if (result.length === 0) {
      selectedRowProducts.forEach((rowId) => {
        const entity = entitiesMap.get(rowId)
        if (entity?.entityType === 'product' && entity.featuredVersion) {
          result.push(entity.featuredVersion.id)
        }
      })
    }

    return result
  }, [selectedRowProducts, selectedRowVersions, entitiesMap])

  //   extract selected products
  const selectedProducts = useMemo(() => {
    const result: string[] = []
    selectedRows.forEach((rowId) => {
      const entity = entitiesMap.get(rowId)
      if (entity?.entityType === 'product') {
        result.push(rowId)
      }
    })
    return result
  }, [selectedRows, entitiesMap])

  const showVersionDetails = versions.length > 0
  const showVersionsTable =
    selectedRowVersions.length === 0 && selectedProducts.length > 0 && showGrid && showProducts

  const [selectedVersions, setSelectedVersions] = useState<string[]>([])

  const versionsKey = versions.join(',')
  useEffect(() => {
    if (showVersionDetails) {
      setSelectedVersions(versions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionsKey])

  const clearSelection = useCallback(() => {
    setSelectedVersions([])
  }, [])

  const isVersionSelected = useCallback(
    (versionId: string) => {
      return selectedVersions.includes(versionId)
    },
    [selectedVersions],
  )

  const toggleVersionSelection = useCallback((versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId)
      }
      return [...prev, versionId]
    })
  }, [])

  const value = useMemo<VersionsSelectionContextValue>(
    () => ({
      selectedVersions,
      selectedProducts,
      setSelectedVersions,
      showVersionDetails,
      showVersionsTable,
      clearSelection,
      isVersionSelected,
      toggleVersionSelection,
    }),
    [
      selectedVersions,
      selectedProducts,
      showVersionDetails,
      showVersionsTable,
      clearSelection,
      isVersionSelected,
      toggleVersionSelection,
    ],
  )

  return (
    <VersionsSelectionContext.Provider value={value}>{children}</VersionsSelectionContext.Provider>
  )
}
