/**
 * Unified hook for managing all lists page view settings.
 *
 * The hook handles:
 * - Filter settings (QueryFilter format)
 * - Column configurations (ColumnsConfig format)
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../../context'
import type { OverviewSettings } from '@shared/api'
import type { ColumnsConfig } from '@shared/containers/ProjectTreeTable/context/column-settings'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import { useViewUpdateHelper } from '../../utils/viewUpdateHelper'
import { useState, useEffect, useCallback, useMemo } from 'react'

// Import the internal QueryFilter type that the app uses
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

export type ListsViewSettings = {
  // Filter management
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void

  // Column management
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[]) => void

  // the powerpack ListValues module's settings (it defines their shape)
  listValues?: Record<string, unknown>
  onUpdateListValues: (settings: Record<string, unknown>) => void
}

export const useListsViewSettings = (): ListsViewSettings => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  // Local state for immediate updates
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnsConfig | null>(null)
  const [localListValues, setLocalListValues] = useState<Record<string, unknown> | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings
  const overviewSettings = viewSettings as OverviewSettings
  const serverFilters = (overviewSettings?.filter as any) ?? {}
  const serverColumns = useMemo(
    () => convertColumnConfigToTanstackStates(overviewSettings),
    [JSON.stringify(viewSettings)],
  )

  // Sync local state with server when the relevant setting fields change.
  // Use per-field deps (not JSON.stringify(viewSettings)) so a change to one
  // field does not clear in-flight local state for unrelated fields, which
  // would cause a visible flicker during rapid sequential updates.
  useEffect(() => {
    setLocalFilters(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify((viewSettings as OverviewSettings)?.filter)])

  useEffect(() => {
    setLocalColumns(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify((viewSettings as OverviewSettings)?.columns)])

  const serverListValues = (viewSettings as any)?.listValues as Record<string, unknown> | undefined
  useEffect(() => {
    setLocalListValues(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serverListValues)])

  // Use local state if available, otherwise use server state
  const filters = localFilters !== null ? localFilters : serverFilters
  const columns = localColumns || serverColumns
  const listValues = localListValues ?? serverListValues

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

  const onUpdateListValues = useCallback(
    async (settings: Record<string, unknown>) => {
      await updateViewSettings({ listValues: settings }, setLocalListValues, settings, {
        errorMessage: 'Failed to update list values settings',
      })
    },
    [updateViewSettings],
  )

  return {
    filters,
    onUpdateFilters,
    columns,
    onUpdateColumns,
    listValues,
    onUpdateListValues,
  }
}
