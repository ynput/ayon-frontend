/**
 * Unified hook for managing all overview page view settings.
 *
 * The hook handles:
 * - Filter settings (QueryFilter format)
 * - Hierarchy visibility toggle
 * - Column configurations (ColumnsConfig format)
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../../context/ViewsContext'
import { OverviewSettings } from '@shared/api'
import { ColumnsConfig } from '@shared/containers/ProjectTreeTable'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import { UpdateViewSettingsFn } from '../../utils/viewUpdateHelper'
import { useState, useEffect, useCallback, useMemo } from 'react'

// Import the internal QueryFilter type that the app uses
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

type Return = {
  // Filter management
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void

  // Hierarchy management
  showHierarchy: boolean
  onUpdateHierarchy: (showHierarchy: boolean) => void

  // Column management
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[]) => void
}

type Props = {
  viewSettings: OverviewSettings | undefined
  updateViewSettings: UpdateViewSettingsFn
}

export const useOverviewViewSettings = ({ viewSettings, updateViewSettings }: Props): Return => {
  // Local state for immediate updates
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)
  const [localHierarchy, setLocalHierarchy] = useState<boolean | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnsConfig | null>(null)

  // Get server settings
  const overviewSettings = viewSettings as OverviewSettings
  const serverFilters = (overviewSettings?.filter as any) ?? {}
  const serverHierarchy = overviewSettings?.showHierarchy ?? true

  const serverColumns = useMemo(
    () => convertColumnConfigToTanstackStates(overviewSettings),
    [JSON.stringify(viewSettings)],
  )

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalFilters(null)
    setLocalHierarchy(null)
    setLocalColumns(null)
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const filters = localFilters !== null ? localFilters : serverFilters
  const showHierarchy = localHierarchy !== null ? localHierarchy : serverHierarchy
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

  // Hierarchy update handler
  const onUpdateHierarchy = useCallback(
    async (newShowHierarchy: boolean) => {
      // If turning hierarchy ON while grouped, clear groupBy in the same update
      if (newShowHierarchy && (columns as ColumnsConfig)?.groupBy) {
        const clearedColumns: ColumnsConfig = { ...columns, groupBy: undefined }
        // Optimistically update local columns to remove grouping
        setLocalColumns(clearedColumns)
        const settings = convertTanstackStatesToColumnConfig(clearedColumns)
        await updateViewSettings(
          { ...settings, showHierarchy: true },
          setLocalHierarchy,
          newShowHierarchy,
          { errorMessage: 'Failed to update hierarchy setting' },
        )
        return
      }

      await updateViewSettings(
        { showHierarchy: newShowHierarchy },
        setLocalHierarchy,
        newShowHierarchy,
        { errorMessage: 'Failed to update hierarchy setting' },
      )
    },
    [updateViewSettings, columns],
  )

  // Column update handler
  const onUpdateColumns = useCallback(
    async (tableSettings: ColumnsConfig, allColumnIds?: string[]) => {
      // Derive a stable allColumnIds if not provided to preserve order and grouping on server
      const derivedAll =
        allColumnIds ||
        [
          ...(tableSettings.columnOrder || []),
          ...Object.keys(tableSettings.columnVisibility || {}),
          ...((tableSettings.columnPinning?.left as string[]) || []),
          ...((tableSettings.columnPinning?.right as string[]) || []),
        ]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)

      const settings = convertTanstackStatesToColumnConfig(tableSettings, derivedAll)
      const hasGroupBy = !!tableSettings.groupBy

      // If grouping is being set, turn off hierarchy in the same update for consistency
      if (hasGroupBy) {
        // Optimistically reflect hierarchy off
        setLocalHierarchy(false)
      }

      await updateViewSettings(
        hasGroupBy ? { ...settings, showHierarchy: false } : settings,
        setLocalColumns,
        tableSettings,
        { errorMessage: 'Failed to update columns' },
      )
    },
    [updateViewSettings],
  )

  return {
    filters,
    onUpdateFilters,
    showHierarchy,
    onUpdateHierarchy,
    columns,
    onUpdateColumns,
  }
}
