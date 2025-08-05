/**
 * Hook that syncs the filter state to view settings.
 *
 * This hook provides an interface for managing the filter settings that
 * automatically syncs changes to the working view settings. It uses local
 * state for immediate UI updates and syncs the settings in the background.
 *
 * The hook handles the conversion between internal QueryFilter format
 * (used by the app) and API QueryFilter format (saved to views).
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../context/ViewsContext'
import { OverviewSettings, useCreateViewMutation } from '@shared/api'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useState, useEffect, useCallback } from 'react'

// Import the internal QueryFilter type that the app uses
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

type Return = {
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void
}

export const useFilters = (): Return => {
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
  const [localFilters, setLocalFilters] = useState<QueryFilter | null>(null)

  // MUTATIONS
  const [createView] = useCreateViewMutation()

  // Get server filter setting - convert from API format to internal format
  const serverFilters = ((viewSettings as OverviewSettings)?.filter as any) ?? {}

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalFilters(null) // Reset local state when server data changes
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const filters = localFilters !== null ? localFilters : serverFilters

  const onUpdateFilters = useCallback(
    async (newFilters: QueryFilter) => {
      try {
        if (!viewType) throw 'No view type provided for updating filters'

        // Immediately update local state for fast UI response
        setLocalFilters(newFilters)

        // Create settings with updated filters
        const currentSettings = viewSettings as OverviewSettings
        const updatedSettings: OverviewSettings = {
          ...currentSettings,
          // Convert internal QueryFilter to API QueryFilter format
          filter: newFilters as any,
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
        setLocalFilters(null)
      } catch (error) {
        // Revert local state on error
        setLocalFilters(null)
        toast.error(`Failed to update filter settings: ${error}`)
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
    filters,
    onUpdateFilters,
  }
}
