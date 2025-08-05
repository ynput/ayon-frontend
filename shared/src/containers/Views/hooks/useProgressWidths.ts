/**
 * Hook that syncs the column width settings to view settings.
 *
 * This hook provides an interface for managing the column width settings that
 * automatically syncs changes to the working view settings. It uses local
 * state for immediate UI updates and syncs the settings in the background.
 *
 * The hook works with ColumnItemModel format for column configurations.
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../context/ViewsContext'
import { TaskProgressSettings, useCreateViewMutation, ColumnItemModel } from '@shared/api'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useState, useEffect, useCallback } from 'react'

type Return = {
  columns: ColumnItemModel[]
  onUpdateColumns: (columns: ColumnItemModel[]) => void
}

export const useProgressWidths = (): Return => {
  // this views context is per page/project
  const {
    viewSettings,
    viewType,
    projectName,
    selectedView,
    setSelectedView,
    workingView,
    onSettingsChanged,
  } = useViewsContext()

  // Local state for immediate updates
  const [localColumns, setLocalColumns] = useState<ColumnItemModel[] | null>(null)

  // MUTATIONS
  const [createView] = useCreateViewMutation()

  // Get server column settings
  const serverColumns = ((viewSettings as TaskProgressSettings)?.columns as ColumnItemModel[]) ?? []

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalColumns(null) // Reset local state when server data changes
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const columns = localColumns !== null ? localColumns : serverColumns

  const onUpdateColumns = useCallback(
    async (newColumns: ColumnItemModel[]) => {
      try {
        if (!viewType) throw 'No view type provided for updating column widths'

        // Immediately update local state for fast UI response
        setLocalColumns(newColumns)

        // Create settings with updated columns
        const currentSettings = viewSettings as TaskProgressSettings
        const updatedSettings: TaskProgressSettings = {
          ...currentSettings,
          columns: newColumns,
        }

        // always update the working view no matter what
        const newWorkingView = generateWorkingView(updatedSettings)
        // only use the generated ID if there is no working view already
        const newWorkingViewId = workingView?.id || newWorkingView.id

        // Make API call in background
        const promise = createView({
          payload: newWorkingView,
          viewType: viewType,
          projectName: projectName,
        }).unwrap()

        // if not working: set that the settings have been changed to show the little blue save button
        if (selectedView && !selectedView.working) {
          onSettingsChanged(true)
        }
        // Always switch to the working view after updating anything
        setSelectedView(newWorkingViewId as string)

        await promise

        // Clear local state after successful API call - the server data will take over
        setLocalColumns(null)
      } catch (error) {
        // Revert local state on error
        setLocalColumns(null)
        toast.error(`Failed to update column width settings: ${error}`)
      }
    },
    [
      viewType,
      viewSettings,
      workingView,
      projectName,
      selectedView,
      createView,
      setSelectedView,
      onSettingsChanged,
    ],
  )

  return {
    columns,
    onUpdateColumns,
  }
}
