/**
 * Unified hook for managing all versions page view settings.
 *
 * The hook handles:
 * - Filter settings (QueryFilter format)
 * - Column configurations (ColumnsConfig format)
 * - Stacked/Grid view toggle
 * - Grid height
 * - Main version preference (latest/hero)
 * - Grouping settings
 * - Sort settings (sortBy and sortDesc)
 *
 * Must be used within a ViewsProvider context.
 */

// TODOOOOO!!! fix some states to use server not just local

import { useViewsContext } from '../../context/ViewsContext'
import { VersionsSettings } from '@shared/api'
import { ColumnsConfig } from '@shared/containers/ProjectTreeTable'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import { useViewUpdateHelper } from '../../utils/viewUpdateHelper'
import { useState, useEffect, useCallback, useMemo } from 'react'

// Import the internal QueryFilter type that the app uses
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

export type VersionsViewSettingsReturn = {
  // Filter management
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void

  // Column management
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[]) => void

  // View mode management
  showStacked: boolean
  onUpdateShowStacked: (showStacked: boolean) => void

  showGrid: boolean
  onUpdateShowGrid: (showGrid: boolean) => void

  gridHeight: number
  onUpdateGridHeight: (gridHeight: number) => void

  // Main version preference
  mainVersion: 'latest' | 'hero'
  onUpdateMainVersion: (mainVersion: 'latest' | 'hero') => void

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
}

export const useVersionsViewSettings = (): VersionsViewSettingsReturn => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  // Local state for immediate updates
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnsConfig | null>(null)
  const [localShowStacked, setLocalShowStacked] = useState<boolean | null>(null)
  const [localShowGrid, setLocalShowGrid] = useState<boolean | null>(null)
  const [localGridHeight, setLocalGridHeight] = useState<number | null>(null)
  const [localMainVersion, setLocalMainVersion] = useState<'latest' | 'hero' | null>(null)
  const [localGroupBy, setLocalGroupBy] = useState<string | undefined | null>(null)
  const [localShowEmptyGroups, setLocalShowEmptyGroups] = useState<boolean | null>(null)
  const [localSortBy, setLocalSortBy] = useState<string | undefined | null>(null)
  const [localSortDesc, setLocalSortDesc] = useState<boolean | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings
  const versionsSettings = viewSettings as VersionsSettings
  const serverFilters = (versionsSettings?.filter as any) ?? {}
  const serverShowStacked = versionsSettings?.showStacked ?? true
  const serverShowGrid = versionsSettings?.showGrid ?? false
  const serverGridHeight = versionsSettings?.gridHeight ?? 200
  const serverMainVersion = versionsSettings?.mainVersion ?? 'latest'
  const serverGroupBy = versionsSettings?.groupBy
  const serverShowEmptyGroups = versionsSettings?.showEmptyGroups ?? false
  const serverSortBy = versionsSettings?.sortBy
  const serverSortDesc = versionsSettings?.sortDesc ?? false

  const serverColumns = useMemo(
    () => convertColumnConfigToTanstackStates(versionsSettings),
    [JSON.stringify(viewSettings)],
  )

  // Sync local state with server when viewSettings change
  // useEffect(() => {
  //   setLocalFilters(null)
  //   setLocalColumns(null)
  //   setLocalShowStacked(null)
  //   setLocalShowGrid(null)
  //   setLocalGridHeight(null)
  //   setLocalMainVersion(null)
  //   setLocalGroupBy(null)
  //   setLocalShowEmptyGroups(null)
  //   setLocalSortBy(null)
  //   setLocalSortDesc(null)
  // }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const filters = localFilters !== null ? localFilters : serverFilters
  const showStacked = localShowStacked
  const showGrid = localShowGrid
  const gridHeight = localGridHeight !== null ? localGridHeight : serverGridHeight
  const mainVersion = localMainVersion !== null ? localMainVersion : serverMainVersion
  const groupBy = localGroupBy !== null ? localGroupBy : serverGroupBy
  const showEmptyGroups =
    localShowEmptyGroups !== null ? localShowEmptyGroups : serverShowEmptyGroups
  const sortBy = localSortBy !== null ? localSortBy : serverSortBy
  const sortDesc = localSortDesc !== null ? localSortDesc : serverSortDesc
  const columns = localColumns || serverColumns

  // Filter update handler
  const onUpdateFilters = useCallback(
    async (newFilters: QueryFilter) => {
      await updateViewSettings({ filter: newFilters as any }, setLocalFilters, newFilters, {
        errorMessage: 'Failed to update filter settings',
      })
    },
    [updateViewSettings],
  )

  // Column update handler
  const onUpdateColumns = useCallback(
    async (tableSettings: ColumnsConfig, allColumnIds?: string[]) => {
      const settings = convertTanstackStatesToColumnConfig(tableSettings, allColumnIds)
      await updateViewSettings(settings, setLocalColumns, tableSettings, {
        errorMessage: 'Failed to update columns',
      })
    },
    [updateViewSettings],
  )

  // Show stacked update handler
  const onUpdateShowStacked = useCallback(
    async (newShowStacked: boolean) => {
      setLocalShowStacked(newShowStacked)
      // await updateViewSettings(
      //   { showStacked: newShowStacked },
      //   setLocalShowStacked,
      //   newShowStacked,
      //   { errorMessage: 'Failed to update stacked view setting' },
      // )
    },
    [updateViewSettings],
  )

  // Show grid update handler
  const onUpdateShowGrid = useCallback(
    async (newShowGrid: boolean) => {
      setLocalShowGrid(newShowGrid)
      // await updateViewSettings({ showGrid: newShowGrid }, setLocalShowGrid, newShowGrid, {
      //   errorMessage: 'Failed to update grid view setting',
      // })
    },
    [updateViewSettings],
  )

  // Grid height update handler
  const onUpdateGridHeight = useCallback(
    async (newGridHeight: number) => {
      await updateViewSettings({ gridHeight: newGridHeight }, setLocalGridHeight, newGridHeight, {
        errorMessage: 'Failed to update grid height',
      })
    },
    [updateViewSettings],
  )

  // Main version update handler
  const onUpdateMainVersion = useCallback(
    async (newMainVersion: 'latest' | 'hero') => {
      await updateViewSettings(
        { mainVersion: newMainVersion },
        setLocalMainVersion,
        newMainVersion,
        { errorMessage: 'Failed to update main version preference' },
      )
    },
    [updateViewSettings],
  )

  // Group by update handler
  const onUpdateGroupBy = useCallback(
    async (newGroupBy: string | undefined) => {
      await updateViewSettings({ groupBy: newGroupBy }, setLocalGroupBy, newGroupBy, {
        errorMessage: 'Failed to update group by setting',
      })
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

  return {
    filters,
    onUpdateFilters,
    columns,
    onUpdateColumns,
    showStacked,
    onUpdateShowStacked,
    showGrid,
    onUpdateShowGrid,
    gridHeight,
    onUpdateGridHeight,
    mainVersion,
    onUpdateMainVersion,
    groupBy,
    onUpdateGroupBy,
    showEmptyGroups,
    onUpdateShowEmptyGroups,
    sortBy,
    onUpdateSortBy,
    sortDesc,
    onUpdateSortDesc,
  }
}
