/**
 * Shared helper for updating view settings with optimistic local state management.
 *
 * This helper provides common functionality used by view settings hooks:
 * - Optimistic local state updates for immediate UI response
 * - Background API calls to persist changes
 * - Error handling with state reversion
 * - Working view management
 */

import { generateWorkingView } from './generateWorkingView'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { useViewsContext } from '../context/ViewsContext'
import { useCreateViewMutation } from '@shared/api'

interface UpdateOptions {
  successMessage?: string
  errorMessage?: string
}

/**
 * Standalone updateViewSettings function that can be passed to addons.
 * This function doesn't use hooks and can be passed as a prop.
 */
export const createUpdateViewSettings = (
  createView: any,
  viewsContext: any,
) => {
  return async (
    updatedSettings: any,
    localStateSetter: (value: any) => void,
    newLocalValue: any,
    options: UpdateOptions = {},
  ) => {
    try {
      const {
        viewSettings,
        viewType,
        projectName,
        selectedView,
        setSelectedView,
        workingView,
        onSettingsChanged,
      } = viewsContext

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
      console.error(error)
      const errorMsg = options.errorMessage || `Failed to update view settings: ${error}`
      toast.error(errorMsg)
    }
  }
}

/**
 * Hook version of updateViewSettings for use within the frontend.
 * This uses hooks internally and provides the same updateViewSettings function.
 */
export const useViewUpdateHelper = () => {
  const [createView] = useCreateViewMutation()
  const viewsContext = useViewsContext()

  const updateViewSettings = useCallback(
    async (
      updatedSettings: any,
      localStateSetter: (value: any) => void,
      newLocalValue: any,
      options: UpdateOptions = {},
    ) => {
      return createUpdateViewSettings(createView, viewsContext)(
        updatedSettings,
        localStateSetter,
        newLocalValue,
        options,
      )
    },
    [createView, viewsContext],
  )

  return { updateViewSettings }
}
