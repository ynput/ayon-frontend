/**
 * Shared helper for updating view settings with optimistic local state management.
 *
 * This helper provides common functionality used by view settings hooks:
 * - Optimistic local state updates for immediate UI response
 * - Background API calls to persist changes
 * - Error handling with state reversion
 * - Working view management
 */

import {
  CreateViewApiArg,
  EntityIdResponse,
  useCreateViewMutation,
  useUpdateViewMutation,
} from '@shared/api'
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
  onApplyViewChanges: (arg: any, viewId?: string) => Promise<EntityIdResponse | void>,
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
    const viewId = workingView?.id
    if (viewId) {
      newWorkingView.id = viewId
    }
    const newWorkingViewId = newWorkingView.id

    // Make API call in background
    // only include the fields that are updating (just settings)
    const payload = viewId ? { settings: newSettings } : newWorkingView

    const promise = onApplyViewChanges(
      {
        payload,
        viewType: viewType,
        projectName: projectName,
      },
      viewId,
    )

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
  const [updateView] = useUpdateViewMutation()

  const viewContext = useViewsContext()

  const onApplyViewChanges = useCallback(
    async (arg: any, viewId?: string) => {
      if (viewId) {
        // Filter the payload to only include valid patch fields
        // and ideally only include fields that are actually being updated.
        // Expecting the caller to provide only the fields they want to update in the payload.
        const patchPayload: any = {}
        const patchFields = ['label', 'owner', 'settings']
        patchFields.forEach((key) => {
          if (arg.payload[key] !== undefined) {
            patchPayload[key] = arg.payload[key]
          }
        })

        return await updateView({
          viewType: arg.viewType,
          projectName: arg.projectName,
          viewId,
          payload: patchPayload,
        }).unwrap()
      } else {
        return await createView(arg).unwrap()
      }
    },
    [createView, updateView],
  )

  const updateViewSettingsHandler = useCallback<UpdateViewSettingsFn>(
    async (...args) => await updateViewSettings(...args, viewContext, onApplyViewChanges),
    [viewContext, onApplyViewChanges],
  )

  return { updateViewSettings: updateViewSettingsHandler, onCreateView: onApplyViewChanges }
}
