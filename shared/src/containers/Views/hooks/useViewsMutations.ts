import {
  CreateViewApiArg,
  useCreateViewMutation,
  useDeleteViewMutation,
  useUpdateViewMutation,
} from '@shared/api'
import { useCallback } from 'react'
import { ViewData } from '../context/ViewsContext'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'

type Props = {
  viewType?: string
  projectName?: string
  onCreate?: (view: ViewData) => void
  onUpdate?: (view: ViewData) => void
  onDelete?: (viewId: string) => void
}

export type UseViewMutations = {
  onCreateView: (payload: CreateViewApiArg['payload'], isProjectScope: boolean) => Promise<void>
  onDeleteView: (viewId: string, isProjectScope: boolean) => Promise<void>
  onUpdateView: (
    viewId: string,
    payload: Partial<ViewData>,
    isProjectScope: boolean,
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
  onCreate,
  onDelete,
  onUpdate,
}: Props): UseViewMutations => {
  // forward mutations to the dialog
  const [createView] = useCreateViewMutation()
  const [deleteView] = useDeleteViewMutation()
  const [updateView] = useUpdateViewMutation()

  const onCreateView = useCallback<R['onCreateView']>(
    async (payload, isProjectScope) => {
      if (!viewType) {
        throw new Error('viewType are required for creating a view')
      }

      console.log(payload, isProjectScope)

      try {
        await createView({
          viewType: viewType,
          projectName: isProjectScope ? projectName : undefined,
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
    async (viewId, payload, isProjectScope) => {
      if (!viewType) {
        throw new Error('viewType are required for updating a view')
      }

      try {
        await updateView({
          viewId,
          viewType,
          projectName: isProjectScope ? projectName : undefined,
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
    [createView, viewType, projectName, onUpdate],
  )

  const onDeleteView = useCallback<R['onDeleteView']>(
    async (viewId, isProjectScope) => {
      if (!viewType) {
        throw new Error('viewType are required for deleting a view')
      }

      try {
        await deleteView({
          viewType: viewType,
          projectName: isProjectScope ? projectName : undefined,
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

      const freshWorkingView = generateWorkingView({})
      if (existingWorkingViewId) {
        freshWorkingView.id = existingWorkingViewId
      }

      try {
        await createView({
          viewType,
          projectName,
          payload: freshWorkingView,
        }).unwrap()
        const newId = freshWorkingView.id as string

        // If we're not currently on the working view, switch to it and mark settings as changed
        if (setSelectedView && setSettingsChanged && selectedViewId && existingWorkingViewId) {
          if (selectedViewId !== existingWorkingViewId) {
            setSelectedView(newId)
            setSettingsChanged(true)
          }
        }

        if (notify) {
          toast.success('View reset to default settings')
        }

        return newId
      } catch (error) {
        console.error('Failed to reset working view:', error)
        if (notify) toast.error('Failed to reset view to default')
        throw error
      }
    },
    [createView, viewType, projectName],
  )

  return {
    onCreateView,
    onUpdateView,
    onDeleteView,
    onResetWorkingView,
  }
}
