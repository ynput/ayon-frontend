/**
 * Unified hook for managing all task progress page view settings.
 *
 * The hook handles:
 * - Filter settings (QueryFilter format)
 * - Progress column widths (ColumnItemModel format)
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../context/ViewsContext'
import { TaskProgressSettings, ColumnItemModel } from '@shared/api'
import { useViewUpdateHelper } from '../utils/viewUpdateHelper'
import { useState, useEffect, useCallback } from 'react'

// Import the internal QueryFilter type that the app uses
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

type Return = {
  // Filter management
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void

  // Column width management
  columns: ColumnItemModel[]
  onUpdateColumns: (columns: ColumnItemModel[]) => void
}

export const useTaskProgressViewSettings = (): Return => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  // Local state for immediate updates
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)
  const [localColumns, setLocalColumns] = useState<ColumnItemModel[] | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings
  const taskProgressSettings = viewSettings as TaskProgressSettings
  const serverFilters = (taskProgressSettings?.filter as any) ?? {}
  const serverColumns = (taskProgressSettings?.columns as ColumnItemModel[]) ?? []

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalFilters(null)
    setLocalColumns(null)
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const filters = localFilters !== null ? localFilters : serverFilters
  const columns = localColumns !== null ? localColumns : serverColumns

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
    async (newColumns: ColumnItemModel[]) => {
      await updateViewSettings({ columns: newColumns }, setLocalColumns, newColumns, {
        errorMessage: 'Failed to update column width settings',
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
