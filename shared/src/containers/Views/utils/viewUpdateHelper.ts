/**
 * Shared helper for updating view settings with optimistic local state management.
 *
 * This helper provides common functionality used by view settings hooks:
 * - Optimistic local state updates for immediate UI response
 * - Background API calls to persist changes
 * - Error handling with state reversion
 * - Working view management
 */

import { CreateViewApiArg, EntityIdResponse, useCreateViewMutation } from '@shared/api'
import { generateWorkingView } from './generateWorkingView'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { useViewsContext, ViewsContextValue } from '../context/ViewsContext'

interface UpdateOptions {
  successMessage?: string
  errorMessage?: string
}

export type UpdateViewSettingsFn = (
  updatedSettings: any,
  localStateSetter: (value: any) => void,
  newLocalValue: any,
  options: UpdateOptions,
) => Promise<void>

export const updateViewSettings = async (
  updatedSettings: any,
  localStateSetter: (value: any) => void,
  newLocalValue: any,
  options: UpdateOptions = {},
  viewContext: ViewsContextValue,
  onCreateView: (payload: CreateViewApiArg) => Promise<EntityIdResponse>,
): Promise<void> => {
  const {
    viewSettings,
    viewType,
    projectName,
    selectedView,
    setSelectedView,
    workingView,
    onSettingsChanged,
  } = viewContext

  if (!viewType) throw new Error('No view type provided for updating view settings')

  const previousSelectedViewId = selectedView?.id
  const wasWorking = selectedView?.working

  try {
    // Immediately update local state for fast UI response
    localStateSetter(newLocalValue)

    // Create settings with updates
    const newSettings = { ...viewSettings, ...updatedSettings }

    // always update the working view no matter what
    const newWorkingView = generateWorkingView(newSettings)

    // Ensure the payload uses the consistent ID if we already have a working view
    if (workingView?.id) {
      newWorkingView.id = workingView.id
    }
    const newWorkingViewId = newWorkingView.id

    // Make API call in background
    const promise = onCreateView({
      payload: newWorkingView,
      viewType: viewType,
      projectName: projectName,
    })

    // if not already on the working view: set that the settings have been changed to show the little blue save button and switch to the working view
    if (!wasWorking) {
      if (selectedView) {
        onSettingsChanged(true)
      }
      setSelectedView(newWorkingViewId as string)
    }

    await promise

    // Clear local state after successful API call - the server data will take over
    localStateSetter(null)

    if (options.successMessage) {
      toast.success(options.successMessage)
    }
  } catch (error) {
    // Revert local state on error
    localStateSetter(null)

    if (previousSelectedViewId) {
      setSelectedView(previousSelectedViewId)
    }

    if (selectedView && !wasWorking) {
      onSettingsChanged(false)
    }

    console.error(error)
    const errorMsg = options.errorMessage || `Failed to update view settings: ${error}`
    toast.error(errorMsg)
  }
}

export const useViewUpdateHelper = () => {
  const [createView] = useCreateViewMutation()

  const viewContext = useViewsContext()

  const onCreateView = useCallback(
    async (payload: CreateViewApiArg) => await createView(payload).unwrap(),
    [createView],
  )

  const updateViewSettingsHandler = useCallback<UpdateViewSettingsFn>(
    async (...args) => await updateViewSettings(...args, viewContext, onCreateView),
    [viewContext],
  )

  return { updateViewSettings: updateViewSettingsHandler, onCreateView }
}
