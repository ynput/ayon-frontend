import { useCallback } from 'react'
import {
  useCreateViewMutation,
  useUpdateViewMutation,
  useDeleteViewMutation,
  viewsQueries,
} from '@shared/api'
import { toast } from 'react-toastify'
import { getScopeTag } from '@shared/api/queries/views/getViews'
import { BASE_VIEW_ID } from './useBuildViewMenuItems'
import { ViewSettings } from '../context/ViewsContext'

type Props = {
  viewType?: string
  projectName?: string
  workingSettings?: ViewSettings
  dispatch?: any
}

export type UseBaseViewMutations = {
  onCreateBaseView: (isStudioScope: boolean) => Promise<void>
  onUpdateBaseView: (baseViewId: string, isStudioScope: boolean) => Promise<void>
  onDeleteBaseView: (baseViewId: string, isStudioScope: boolean) => Promise<void>
}

export const useBaseViewMutations = ({
  viewType,
  projectName,
  workingSettings,
  dispatch,
}: Props): UseBaseViewMutations => {
  const [createViewMutation] = useCreateViewMutation()
  const [updateViewMutation] = useUpdateViewMutation()
  const [deleteViewMutation] = useDeleteViewMutation()

  const onCreateBaseView = useCallback(
    async (isStudioScope: boolean) => {
      try {
        const settings = workingSettings || {}
        const baseViewPayload = {
          label: BASE_VIEW_ID,
          working: false,
          settings,
        } as any

        const result = await createViewMutation({
          payload: baseViewPayload,
          viewType: viewType as string,
          projectName: isStudioScope ? undefined : projectName,
        }).unwrap()

        dispatch(
          viewsQueries.util.invalidateTags([
            { type: 'view', id: result.id },
            getScopeTag(viewType as string, isStudioScope ? undefined : projectName),
          ]),
        )

        const scope = isStudioScope ? 'Studio' : 'Project'
        toast.success(`${scope} default view created successfully`)
      } catch (error: any) {
        const scope = isStudioScope ? 'studio' : 'project'
        console.error(`Failed to create ${scope} base view:`, error)
        toast.error(`Failed to create ${scope} base view: ${error?.message || error}`)
      }
    },
    [createViewMutation, viewType, projectName, workingSettings, dispatch],
  )

  const onUpdateBaseView = useCallback(
    async (baseViewId: string, isStudioScope: boolean) => {
      try {
        const settings = workingSettings || {}
        await updateViewMutation({
          viewId: baseViewId,
          viewType: viewType as string,
          projectName: isStudioScope ? undefined : projectName,
          payload: { settings },
        }).unwrap()

        dispatch(
          viewsQueries.util.invalidateTags([
            { type: 'view', id: baseViewId },
            getScopeTag(viewType as string, isStudioScope ? undefined : projectName),
          ]),
        )

        const scope = isStudioScope ? 'Studio' : 'Project'
        toast.success(`${scope} default view updated successfully`)
      } catch (error: any) {
        const scope = isStudioScope ? 'studio' : 'project'
        console.error(`Failed to update ${scope} base view:`, error)
        toast.error(`Failed to update ${scope} base view: ${error?.message || error}`)
      }
    },
    [updateViewMutation, viewType, projectName, workingSettings, dispatch],
  )

  const onDeleteBaseView = useCallback(
    async (baseViewId: string, isStudioScope: boolean) => {
      try {
        await deleteViewMutation({
          viewId: baseViewId,
          viewType: viewType as string,
          projectName: isStudioScope ? undefined : projectName,
        }).unwrap()

        // Invalidate tags to force refetch - use the same tag format as getBaseView
        dispatch(
          viewsQueries.util.invalidateTags([
            { type: 'view', id: baseViewId },
            getScopeTag(viewType as string, isStudioScope ? undefined : projectName),
          ]),
        )

        const scope = isStudioScope ? 'Studio' : 'Project'
        toast.success(`${scope} default view removed successfully`)
      } catch (error: any) {
        const scope = isStudioScope ? 'studio' : 'project'
        console.error(`Failed to remove ${scope} base view:`, error)
        toast.error(`Failed to remove ${scope} base view: ${error?.message || error}`)
      }
    },
    [deleteViewMutation, viewType, projectName, dispatch],
  )

  return {
    onCreateBaseView,
    onUpdateBaseView,
    onDeleteBaseView,
  }
}
