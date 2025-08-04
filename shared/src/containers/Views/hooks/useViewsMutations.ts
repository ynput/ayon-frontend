import { CreateViewApiArg, useCreateViewMutation, useDeleteViewMutation } from '@shared/api'
import React, { useCallback } from 'react'

type Props = {
  viewType?: string
  projectName?: string
}

export type UseViewMutations = {
  onCreateView: (payload: CreateViewApiArg['payload']) => Promise<void>
  onDeleteView: (viewId: string) => Promise<void>
}

export const useViewsMutations = ({ viewType, projectName }: Props): UseViewMutations => {
  // forward mutations to the dialog
  const [createView] = useCreateViewMutation()
  const [deleteView] = useDeleteViewMutation()

  const onCreateView = useCallback(
    async (payload: CreateViewApiArg['payload']) => {
      if (!viewType || !projectName) {
        throw new Error('viewType and projectName are required for creating a view')
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

  const onDeleteView = useCallback(
    async (viewId: string) => {
      if (!viewType || !projectName) {
        throw new Error('viewType and projectName are required for deleting a view')
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
    onDeleteView,
  }
}
