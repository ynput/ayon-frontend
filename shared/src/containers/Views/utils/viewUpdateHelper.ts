/**
 * Shared helper for updating view settings with optimistic local state management.
 *
 * This helper provides common functionality used by view settings hooks:
 * - Optimistic local state updates for immediate UI response
 * - Background API calls to persist changes
 * - Error handling with state reversion
 * - Working view management
 */

import { useCreateViewMutation } from '@shared/api'
import { generateWorkingView } from './generateWorkingView'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { useViewsContext } from '../context/ViewsContext'

interface UpdateOptions {
  successMessage?: string
  errorMessage?: string
}

export const useViewUpdateHelper = () => {
  const [createView] = useCreateViewMutation()

  const {
    viewSettings,
    viewType,
    projectName,
    selectedView,
    setSelectedView,
    workingView,
    onSettingsChanged,
  } = useViewsContext()

  const updateViewSettings = useCallback(
    async (
      updatedSettings: any,
      localStateSetter: (value: any) => void,
      newLocalValue: any,
      options: UpdateOptions = {},
    ) => {
      try {
        if (!viewType) throw 'No view type provided for updating view settings'
        if (!projectName) throw 'No project name provided for updating view settings'

        // Immediately update local state for fast UI response
        localStateSetter(newLocalValue)

        // Create settings with updates
        const newSettings = { ...viewSettings, ...updatedSettings }

        // always update the working view no matter what
        const newWorkingView = generateWorkingView(newSettings)
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
        localStateSetter(null)

        if (options.successMessage) {
          toast.success(options.successMessage)
        }
      } catch (error) {
        // Revert local state on error
        localStateSetter(null)
        const errorMsg = options.errorMessage || `Failed to update view settings: ${error}`
        toast.error(errorMsg)
      }
    },
    [createView, viewType, projectName, workingView, selectedView, onSettingsChanged, viewSettings],
  )

  return { updateViewSettings }
}
