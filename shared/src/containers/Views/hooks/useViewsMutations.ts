import { CreateViewApiArg, useCreateViewMutation, useDeleteViewMutation } from '@shared/api'
import React, { useCallback } from 'react'
import { ViewData } from '../context/ViewsContext'

type Props = {
  viewType?: string
  projectName?: string
}

export type UseViewMutations = {
  onCreateView: (payload: CreateViewApiArg['payload']) => Promise<void>
  onDeleteView: (viewId: string) => Promise<void>
  onUpdateView: (viewId: string, payload: Partial<ViewData>) => Promise<void>
}
type R = UseViewMutations

export const useViewsMutations = ({ viewType, projectName }: Props): UseViewMutations => {
  // forward mutations to the dialog
  const [createView] = useCreateViewMutation()
  const [deleteView] = useDeleteViewMutation()

  const onCreateView = useCallback<R['onCreateView']>(
    async (payload) => {
      if (!viewType) {
        throw new Error('viewType are required for creating a view')
      }

      try {
        await createView({
          viewType: viewType,
          projectName: projectName,
          payload,
        }).unwrap()
      } catch (error) {
        console.error('Failed to create view:', error)
        throw error
      }
    },
    [createView, viewType, projectName],
  )

  const onUpdateView = useCallback<R['onUpdateView']>(
    async (viewId, payload) => {
      if (!viewType) {
        throw new Error('viewType are required for updating a view')
      }

      try {
        // await updateView({
        //         viewId,
        //         viewType,
        //         projectName,
        //         payload,
        //       }).unwrap()
      } catch (error) {
        console.error('Failed to update view:', error)
        throw error
      }
    },
    [createView, viewType, projectName],
  )

  const onDeleteView = useCallback<R['onDeleteView']>(
    async (viewId) => {
      if (!viewType) {
        throw new Error('viewType are required for deleting a view')
      }

      try {
        await deleteView({
          viewType: viewType,
          projectName: projectName,
          viewId,
        }).unwrap()
      } catch (error) {
        console.error('Failed to delete view:', error)
        throw error
      }
    },
    [deleteView, viewType, projectName],
  )

  return {
    onCreateView,
    onUpdateView,
    onDeleteView,
  }
}
