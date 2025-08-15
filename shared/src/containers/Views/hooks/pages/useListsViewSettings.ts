/**
 * Unified hook for managing all lists page view settings.
 *
 * The hook handles:
 * - Filter settings (QueryFilter format)
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
import { useViewUpdateHelper } from '../../utils/viewUpdateHelper'
import { useState, useEffect, useCallback, useMemo } from 'react'

// Import the internal QueryFilter type that the app uses
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

export type ListsViewSettings = {
  // Filter management
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void

  // Column management
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[]) => void
}

export const useListsViewSettings = (): ListsViewSettings => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  // Local state for immediate updates
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnsConfig | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings
  const overviewSettings = viewSettings as OverviewSettings
  const serverFilters = (overviewSettings?.filter as any) ?? {}
  const serverColumns = useMemo(
    () => convertColumnConfigToTanstackStates(overviewSettings),
    [JSON.stringify(viewSettings)],
  )

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalFilters(null)
    setLocalColumns(null)
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const filters = localFilters !== null ? localFilters : serverFilters
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

  return {
    filters,
    onUpdateFilters,
    columns,
    onUpdateColumns,
  }
}
