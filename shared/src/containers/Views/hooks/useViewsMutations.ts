import {
  CreateViewApiArg,
  useCreateViewMutation,
  useDeleteViewMutation,
  useUpdateViewMutation,
  useSetDefaultViewMutation,
  ViewListItemModel,
  viewsQueries,
} from '@shared/api'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import type { AnyAction, ThunkDispatch } from '@reduxjs/toolkit'
import { ViewData } from '../context/ViewsContext'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'

type Props = {
  viewType?: string
  projectName?: string
  viewsList?: ViewListItemModel[]
  onCreate?: (view: ViewData) => void
  onUpdate?: (view: ViewData) => void
  onDelete?: (viewId: string) => void
}

export type UseViewMutations = {
  onCreateView: (payload: CreateViewApiArg['payload'], isStudioScope: boolean) => Promise<void>
  onDeleteView: (viewId: string, isStudioScope: boolean) => Promise<void>
  onUpdateView: (
    viewId: string,
    payload: Partial<ViewData>,
    isStudioScope: boolean,
  ) => Promise<void>
  onResetWorkingView: (args?: {
    existingWorkingViewId?: string
    selectedViewId?: string
    setSelectedView?: (id: string) => void
    setSettingsChanged?: (changed: boolean) => void
    notify?: boolean
  }) => Promise<string>
}
type R = UseViewMutations

export const useViewsMutations = ({
  viewType,
  projectName,
  viewsList,
  onCreate,
  onDelete,
  onUpdate,
}: Props): UseViewMutations => {
  // forward mutations to the dialog
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>()
  const [createView] = useCreateViewMutation()
  const [deleteView] = useDeleteViewMutation()
  const [updateView] = useUpdateViewMutation()
  const [setDefaultView] = useSetDefaultViewMutation()


  const onCreateView = useCallback<R['onCreateView']>(
    async (payload, isStudioScope) => {
      if (!viewType) {
        throw new Error('viewType are required for creating a view')
      }

      try {
        await createView({
          viewType: viewType,
          projectName: isStudioScope ? undefined : projectName,
          payload,
        }).unwrap()

        if (onCreate) {
          onCreate(payload as ViewData)
        }
      } catch (error) {
        console.error('Failed to create view:', error)
        throw error
      }
    },
    [createView, viewType, projectName, onCreate],
  )

  const onUpdateView = useCallback<R['onUpdateView']>(
    async (viewId, payload, isStudioScope) => {
      if (!viewType) {
        throw new Error('viewType are required for updating a view')
      }

      try {
        await updateView({
          viewId,
          viewType,
          projectName: isStudioScope ? undefined : projectName,
          payload,
        }).unwrap()

        if (onUpdate) {
          onUpdate({ ...payload, id: viewId } as ViewData)
        }
      } catch (error) {
        console.error('Failed to update view:', error)
        throw error
      }
    },
    [updateView, viewType, projectName, onUpdate],
  )

  const onDeleteView = useCallback<R['onDeleteView']>(
    async (viewId, isStudioScope) => {
      if (!viewType) {
        throw new Error('viewType are required for deleting a view')
      }

      try {
        await deleteView({
          viewType: viewType,
          projectName: isStudioScope ? undefined : projectName,
          viewId,
        }).unwrap()

        if (onDelete) {
          onDelete(viewId)
        }
      } catch (error) {
        console.error('Failed to delete view:', error)
        throw error
      }
    },
    [deleteView, viewType, projectName, onDelete],
  )

  const onResetWorkingView = useCallback<R['onResetWorkingView']>(
    async (args) => {
      const { existingWorkingViewId, selectedViewId, setSelectedView, setSettingsChanged, notify } =
        args || {}
      if (!viewType) {
        throw new Error('viewType are required for resetting a view')
      }

      try {
        // First, fetch the base view to get the template settings
        const baseViewPromise = dispatch(
          viewsQueries.endpoints.getBaseView.initiate({ viewType, projectName })
        )

        const baseViewResult = await baseViewPromise
        const baseView = baseViewResult.data
        const hasBaseView = baseView && baseView.settings && Object.keys(baseView.settings).length > 0
        const templateSettings = baseView?.settings ?? {}

        // Determine the view ID to use - use base view ID or generate new one
        const viewId: string = baseView?.id as string ?? generateWorkingView().id

        // Prepare the working view payload with base view settings
        const workingViewPayload = {
          id: viewId,
          label: 'Working',
          working: true,
          settings: templateSettings,
        }

        // Update existing working view or create a new one
        if (existingWorkingViewId) {
          await updateView({
            viewId: existingWorkingViewId,
            viewType,
            projectName,
            payload: { settings: templateSettings },
          }).unwrap()
        } else {
          await createView({
            viewType,
            projectName,
            payload: workingViewPayload,
          }).unwrap()
        }

        // Set this working view as the user's default view
        await setDefaultView({
          viewType,
          projectName,
          setDefaultViewRequestModel: { viewId },
        }).unwrap()

        // Cleanup: unsubscribe from the base view query if it has the unsubscribe method
        if ('unsubscribe' in baseViewPromise && typeof baseViewPromise.unsubscribe === 'function') {
          baseViewPromise.unsubscribe()
        }

        // If we're not currently on the working view, switch to it and mark settings as changed
        if (setSelectedView && setSettingsChanged && selectedViewId && existingWorkingViewId) {
          if (selectedViewId !== existingWorkingViewId) {
            setSelectedView(viewId)
            setSettingsChanged(true)
          }
        }

        if (notify) {
          const message = hasBaseView
            ? 'View reset to base view and set as your default'
            : 'View reset to default settings'
          toast.success(message)
        }

        return viewId
      } catch (error) {
        console.error('Failed to reset working view:', error)
        if (notify) toast.error('Failed to reset view to default')
        throw error
      }
    },
    [createView, updateView, setDefaultView, viewType, projectName, dispatch],
  )

  return {
    onCreateView,
    onUpdateView,
    onDeleteView,
    onResetWorkingView,
  }
}
