import { QueryFilter, VersionsSettings } from '@shared/api'
import { ColumnsConfig, useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type VPViewsContextValue = {
  // Filter management
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void

  // Column management
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[]) => void

  // slicerType
  slicerType: string
  onUpdateSlicerType: (slicerType: string) => void

  // View mode management
  viewGroupBy: string | undefined
  onUpdateViewGroupBy: (viewGroupBy: string | undefined) => void

  showProducts: boolean
  onUpdateShowProducts: (showProducts: boolean) => void

  showGrid: boolean
  onUpdateShowGrid: (showGrid: boolean) => void

  gridHeight: number
  onUpdateGridHeight: (gridHeight: number) => void
  onUpdateGridHeightWithPersistence: (gridHeight: number) => void

  rowHeight: number
  onUpdateRowHeight: (rowHeight: number) => void

  // Main version preference
  featuredVersionOrder: string[]
  onUpdateFeaturedVersionOrder: (featuredVersionOrder: string[]) => void

  // Grouping management
  groupBy: string | undefined
  onUpdateGroupBy: (groupBy: string | undefined) => void

  showEmptyGroups: boolean
  onUpdateShowEmptyGroups: (showEmptyGroups: boolean) => void

  // Sort management
  sortBy: string | undefined
  onUpdateSortBy: (sortBy: string | undefined) => void

  sortDesc: boolean
  onUpdateSortDesc: (sortDesc: boolean) => void
  onUpdateSorting: (sortBy: string | undefined, sortDesc: boolean) => void
}

const VPViewsContext = createContext<VPViewsContextValue | null>(null)

export const useVPViewsContext = () => {
  const context = useContext(VPViewsContext)
  if (!context) {
    throw new Error('useVPViewsContext must be used within VersionsDataProvider')
  }
  return context
}

interface VersionsViewsProviderProps {
  children: ReactNode
}

export const VPViewsProvider: FC<VersionsViewsProviderProps> = ({ children }) => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  // Memoize versionsSettings to prevent unnecessary re-renders when viewSettings
  // reference changes but values are the same
  const versionsSettings = useMemo(() => viewSettings as VersionsSettings, [viewSettings])

  // Local state for immediate updates
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnsConfig | null>(null)
  const [localViewGroupBy, setLocalViewGroupBy] = useState<string | undefined | null>(null)
  const [localShowGrid, setLocalShowGrid] = useState<boolean | null>(null)
  const [localGridHeight, setLocalGridHeight] = useState<number | null>(null)
  const [localGridHeightImmediate, setLocalGridHeightImmediate] = useState<number | null>(null)
  const [localRowHeight, setLocalRowHeight] = useState<number | null>(null)
  const [localFeaturedVersionOrder, setLocalFeaturedVersionOrder] = useState<string[] | null>(null)
  const [localShowEmptyGroups, setLocalShowEmptyGroups] = useState<boolean | null>(null)
  const [localSortBy, setLocalSortBy] = useState<string | undefined | null>(null)
  const [localSortDesc, setLocalSortDesc] = useState<boolean | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings
  const serverFilters = useMemo(
    () => (versionsSettings?.filter as any) ?? { conditions: [] },
    [versionsSettings?.filter],
  )
  const serverSlicerType = useMemo(
    () => versionsSettings?.slicerType ?? '',
    [versionsSettings?.slicerType],
  )
  const serverViewGroupBy = useMemo(() => {
    // Server → client translation
    // 'hierarchy' when showProducts is true, otherwise groupBy value (or undefined)
    const result = versionsSettings?.showProducts ? 'hierarchy' : (versionsSettings?.groupBy ?? undefined)
      return result
  }, [versionsSettings?.showProducts, versionsSettings?.groupBy])

  const serverShowGrid = useMemo(
    () => versionsSettings?.showGrid ?? false,
    [versionsSettings?.showGrid],
  )
  const serverGridHeight = useMemo(
    () => versionsSettings?.gridHeight ?? 200,
    [versionsSettings?.gridHeight],
  )
  const serverRowHeight = useMemo(
    () => versionsSettings?.rowHeight ?? 50,
    [versionsSettings?.rowHeight],
  )
  const serverFeaturedVersionOrder = useMemo(
    () => versionsSettings?.featuredVersionOrder ?? [],
    [versionsSettings?.featuredVersionOrder],
  )
  const serverShowEmptyGroups = useMemo(
    () => versionsSettings?.showEmptyGroups ?? false,
    [versionsSettings?.showEmptyGroups],
  )
  const serverSortBy = useMemo(() => versionsSettings?.sortBy ?? 'name', [versionsSettings?.sortBy])
  const serverSortDesc = useMemo(
    () => versionsSettings?.sortDesc ?? false,
    [versionsSettings?.sortDesc],
  )

  const serverColumns = useMemo(
    () => convertColumnConfigToTanstackStates(versionsSettings),
    [versionsSettings],
  )

  // Sync local state with server when viewSettings change
  // Note: Excluded localColumns, localSortBy/localSortDesc, localShowGrid, and localViewGroupBy
  // because we manage them ourselves for immediate updates
  useEffect(() => {
    setLocalFilters(null)
    setLocalGridHeight(null)
    setLocalGridHeightImmediate(null)
    setLocalFeaturedVersionOrder(null)
    setLocalShowEmptyGroups(null)
  }, [
    versionsSettings?.filter,
    versionsSettings?.slicerType,
    versionsSettings?.gridHeight,
    versionsSettings?.rowHeight,
    versionsSettings?.featuredVersionOrder,
    versionsSettings?.showEmptyGroups,
  ])

  // Use local state if available, otherwise use server state
  const filters = useMemo(
    () => (localFilters !== null ? localFilters : serverFilters),
    [localFilters, serverFilters],
  )
  const slicerType = serverSlicerType
  const viewGroupBy = useMemo(
    () => {
      const result = localViewGroupBy !== null ? localViewGroupBy : serverViewGroupBy
      return result
    },
    [localViewGroupBy, serverViewGroupBy],
  )
  // Compute showProducts and groupBy from viewGroupBy
  const showProducts = viewGroupBy === 'hierarchy'
  const groupBy = viewGroupBy !== 'hierarchy' ? viewGroupBy : undefined


  const showGrid = useMemo(
    () => (localShowGrid !== null ? localShowGrid : serverShowGrid),
    [localShowGrid, serverShowGrid],
  )
  const gridHeight = useMemo(
    () =>
      localGridHeightImmediate !== null
        ? localGridHeightImmediate
        : localGridHeight !== null
        ? localGridHeight
        : serverGridHeight,
    [localGridHeightImmediate, localGridHeight, serverGridHeight],
  )
  const rowHeight = useMemo(
    () => (localRowHeight !== null ? localRowHeight : serverRowHeight),
    [localRowHeight, serverRowHeight],
  )
  const featuredVersionOrder = useMemo(
    () =>
      localFeaturedVersionOrder?.length ? localFeaturedVersionOrder : serverFeaturedVersionOrder,
    [localFeaturedVersionOrder, serverFeaturedVersionOrder],
  )
  const showEmptyGroups = useMemo(
    () => (localShowEmptyGroups !== null ? localShowEmptyGroups : serverShowEmptyGroups),
    [localShowEmptyGroups, serverShowEmptyGroups],
  )
  const sortBy = useMemo(
    () => (localSortBy !== null ? localSortBy : serverSortBy),
    [localSortBy, JSON.stringify(serverSortBy)],
  )
  const sortDesc = useMemo(
    () => (localSortDesc !== null ? localSortDesc : serverSortDesc),
    [localSortDesc, serverSortDesc],
  )
  const columns = useMemo(() => localColumns || serverColumns, [localColumns, serverColumns])

  // Filter update handler
  const onUpdateFilters = useCallback(
    async (newFilters: QueryFilter) => {
      await updateViewSettings({ filter: newFilters as any }, setLocalFilters, newFilters, {
        errorMessage: 'Failed to update filter settings',
      })
    },
    [updateViewSettings],
  )

  // Slicer type update handler (no local state needed — slicer context is the optimistic state)
  const noopSlicerType = useCallback(() => {}, [])
  const onUpdateSlicerType = useCallback(
    async (newSlicerType: string) => {
      await updateViewSettings({ slicerType: newSlicerType }, noopSlicerType, newSlicerType, {
        errorMessage: 'Failed to update slicer type',
      })
    },
    [updateViewSettings],
  )

  // Unified view grouping handler (defined first so onUpdateColumns can use it)
  const onUpdateViewGroupBy = useCallback(
    async (newViewGroupBy: string | undefined) => {
      const serverSettings =
        newViewGroupBy === 'hierarchy'
          ? { showProducts: true, groupBy: undefined }
          : { showProducts: false, groupBy: newViewGroupBy }

      setLocalViewGroupBy(newViewGroupBy)

      // Update localColumns groupBy to match the new grouping (preserving sort direction)
      setLocalColumns((prevColumns) => {
        if (!prevColumns) return prevColumns
        if (newViewGroupBy && newViewGroupBy !== 'hierarchy') {
          return {
            ...prevColumns,
            groupBy: {
              id: newViewGroupBy,
              desc: prevColumns.groupBy?.desc ?? false,
            },
          }
        } else {
          return {
            ...prevColumns,
            groupBy: undefined,
          }
        }
      })

      await updateViewSettings(
        serverSettings,
        () => {},
        newViewGroupBy,
        {
          errorMessage: 'Failed to update group by setting',
        },
      )
    },
    [updateViewSettings],
  )

  // Column update handler
  const onUpdateColumns = useCallback(
    async (tableSettings: ColumnsConfig, allColumnIds?: string[]) => {
      const settings = convertTanstackStatesToColumnConfig(tableSettings, allColumnIds)
      const currentGroupBy = groupBy // capture current value

      // Track whether we delegated groupBy to the unified handler
      let groupByHandledByViewGroupBy = false

      // Handle groupBy changes from settings panel
      if (settings.groupBy !== undefined && settings.groupBy !== currentGroupBy) {
        groupByHandledByViewGroupBy = true
        // Delegate to the unified handler for field groupings
        if (settings.groupBy === 'hierarchy') {
          await onUpdateViewGroupBy('hierarchy')
        } else {
          await onUpdateViewGroupBy(settings.groupBy)
        }
      }

      // Always sync local columns state
      setLocalColumns(tableSettings)

      // Persist only the fields that changed to server
      // Skip groupBy if it was already persisted by onUpdateViewGroupBy above
      const persistSettings: Record<string, any> = {}
      if (settings.groupBy !== undefined && !groupByHandledByViewGroupBy) {
        persistSettings.groupBy = settings.groupBy
      }
      if (settings.groupSortByDesc !== undefined && !groupByHandledByViewGroupBy) {
        persistSettings.groupSortByDesc = settings.groupSortByDesc
      }
      if (settings.showEmptyGroups !== undefined) persistSettings.showEmptyGroups = settings.showEmptyGroups
      if (settings.sortBy !== undefined) persistSettings.sortBy = settings.sortBy
      if (settings.sortDesc !== undefined) persistSettings.sortDesc = settings.sortDesc
      if (settings.rowHeight !== undefined) persistSettings.rowHeight = settings.rowHeight

      // Only persist if there are actually settings to persist
      if (Object.keys(persistSettings).length > 0) {
        await updateViewSettings(persistSettings, () => {}, persistSettings, {
          errorMessage: 'Failed to update columns settings',
        })
      }
    },
    [groupBy, onUpdateViewGroupBy, updateViewSettings],
  )

  // Show products update handler (delegates to unified handler)
  const onUpdateShowProducts = useCallback(
    (newShowProducts: boolean) => {
      return onUpdateViewGroupBy(newShowProducts ? 'hierarchy' : undefined)
    },
    [onUpdateViewGroupBy],
  )

  // Group by update handler (delegates to unified handler)
  const onUpdateGroupBy = useCallback(
    (newGroupBy: string | undefined) => {
      return onUpdateViewGroupBy(newGroupBy)
    },
    [onUpdateViewGroupBy],
  )

  // Show grid update handler
  const onUpdateShowGrid = useCallback(
    async (newShowGrid: boolean) => {
      setLocalShowGrid(newShowGrid)
      // Persist to server without resetting local state (preserve user's preference)
      await updateViewSettings({ showGrid: newShowGrid }, () => {}, newShowGrid, {
        errorMessage: 'Failed to update grid view setting',
      })
    },
    [updateViewSettings],
  )

  // Grid height update handler (immediate, no API call)
  const onUpdateGridHeight = useCallback((newGridHeight: number) => {
    setLocalGridHeightImmediate(newGridHeight)
  }, [])

  // Grid height update handler with persistence (API call)
  const onUpdateGridHeightWithPersistence = useCallback(
    async (newGridHeight: number) => {
      await updateViewSettings({ gridHeight: newGridHeight }, setLocalGridHeight, newGridHeight, {
        errorMessage: 'Failed to update grid height',
      })
      // Clear immediate state after persistence
      setLocalGridHeightImmediate(null)
    },
    [updateViewSettings],
  )

  // Row height update handler
  const onUpdateRowHeight = useCallback(
    async (newRowHeight: number) => {
      await updateViewSettings({ rowHeight: newRowHeight }, setLocalRowHeight, newRowHeight, {
        errorMessage: 'Failed to update row height',
      })
    },
    [updateViewSettings],
  )

  // Main version update handler
  const onUpdateFeaturedVersionOrder = useCallback(
    async (newFeaturedVersionOrder: string[]) => {
      await updateViewSettings(
        { featuredVersionOrder: newFeaturedVersionOrder },
        setLocalFeaturedVersionOrder,
        newFeaturedVersionOrder,
        { errorMessage: 'Failed to update main version preference' },
      )
    },
    [updateViewSettings],
  )

  // Show empty groups update handler
  const onUpdateShowEmptyGroups = useCallback(
    async (newShowEmptyGroups: boolean) => {
      await updateViewSettings(
        { showEmptyGroups: newShowEmptyGroups },
        setLocalShowEmptyGroups,
        newShowEmptyGroups,
        { errorMessage: 'Failed to update show empty groups setting' },
      )
    },
    [updateViewSettings],
  )

  // Sort by update handler
  const onUpdateSortBy = useCallback(
    async (newSortBy: string | undefined) => {
      await updateViewSettings({ sortBy: newSortBy }, setLocalSortBy, newSortBy, {
        errorMessage: 'Failed to update sort by setting',
      })
    },
    [updateViewSettings],
  )

  // Sort desc update handler
  const onUpdateSortDesc = useCallback(
    async (newSortDesc: boolean) => {
      await updateViewSettings({ sortDesc: newSortDesc }, setLocalSortDesc, newSortDesc, {
        errorMessage: 'Failed to update sort direction',
      })
    },
    [updateViewSettings],
  )

  // updating sortBy and sortDesc together
  const onUpdateSorting = useCallback(
    async (newSortBy: string | undefined, newSortDesc: boolean) => {
      await updateViewSettings(
        { sortBy: newSortBy, sortDesc: newSortDesc },
        () => {
          setLocalSortBy(newSortBy)
          setLocalSortDesc(newSortDesc)
        },
        { sortBy: newSortBy, sortDesc: newSortDesc },
        {
          errorMessage: 'Failed to update sorting',
        },
      )
    },
    [updateViewSettings],
  )

  return (
    <VPViewsContext.Provider
      value={{
        filters,
        onUpdateFilters,
        columns,
        onUpdateColumns,
        slicerType,
        onUpdateSlicerType,
        viewGroupBy,
        onUpdateViewGroupBy,
        showProducts,
        onUpdateShowProducts,
        showGrid,
        onUpdateShowGrid,
        gridHeight,
        onUpdateGridHeight,
        onUpdateGridHeightWithPersistence,
        rowHeight,
        onUpdateRowHeight,
        featuredVersionOrder,
        onUpdateFeaturedVersionOrder,
        groupBy,
        onUpdateGroupBy,
        showEmptyGroups,
        onUpdateShowEmptyGroups,
        sortBy,
        onUpdateSortBy,
        sortDesc,
        onUpdateSortDesc,
        onUpdateSorting,
      }}
    >
      {children}
    </VPViewsContext.Provider>
  )
}
