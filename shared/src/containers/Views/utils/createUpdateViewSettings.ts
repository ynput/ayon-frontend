/**
 * Factory function to create an updateViewSettings function for use in addons.
 *
 * This allows addons to handle their own view settings updates without needing
 * to pass hooks as props (which doesn't work across module boundaries).
 *
 * Usage in addon:
 * ```tsx
 * import { useCreateViewMutation } from '@shared/api'
 *
 * const MyAddon = ({ viewsContext, createUpdateViewSettings }) => {
 *   const [createView] = useCreateViewMutation()
 *   const updateViewSettings = createUpdateViewSettings(createView, viewsContext)
 *
 *   const handleUpdate = async (newSettings) => {
 *     await updateViewSettings(newSettings)
 *   }
 * }
 * ```
 */

import { generateWorkingView } from './generateWorkingView'
import { toast } from 'react-toastify'
import { ViewsContextValue } from '../context/ViewsContext'

interface UpdateOptions {
  successMessage?: string
  errorMessage?: string
}

type CreateViewMutation = any // ReturnType of useCreateViewMutation()[0]

/**
 * Creates an updateViewSettings function bound to the given context.
 *
 * @param createView - The createView mutation function from useCreateViewMutation()
 * @param context - The ViewsContext value
 * @returns A function to update view settings
 */
export const createUpdateViewSettings = (
  createView: CreateViewMutation,
  context: ViewsContextValue,
) => {
  return async (
    updatedSettings: any,
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
      } = context

      if (!viewType) throw 'No view type provided for updating view settings'
      if (!projectName) throw 'No project name provided for updating view settings'

      // Create settings with updates
      const newSettings = { ...viewSettings, ...updatedSettings }

      // Determine the working view ID - reuse existing if available
      const newWorkingViewId = workingView?.id || generateWorkingView().id

      // Create the working view payload with the consistent ID
      const newWorkingView = {
        id: newWorkingViewId,
        label: 'Working',
        working: true,
        settings: newSettings,
      }

      console.log('[createUpdateViewSettings] Update details:', {
        hasWorkingView: !!workingView,
        workingViewId: workingView?.id,
        newWorkingViewId,
        willGenerateNewId: !workingView?.id,
        updatedSettings,
        newSettings,
      })

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

      if (options.successMessage) {
        toast.success(options.successMessage)
      }
    } catch (error) {
      console.error(error)
      const errorMsg = options.errorMessage || `Failed to update view settings: ${error}`
      toast.error(errorMsg)
      throw error // Re-throw so addon can handle if needed
    }
  }
}
