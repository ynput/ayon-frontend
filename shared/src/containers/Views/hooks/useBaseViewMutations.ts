import { useCallback } from 'react'
import {
  useCreateViewMutation,
  useUpdateViewMutation,
  useDeleteViewMutation,
  useSetDefaultViewMutation,
  viewsQueries,
  ViewListItemModel,
} from '@shared/api'
import { toast } from 'react-toastify'
import { getScopeTag } from '@shared/api/queries/views/getViews'
import { BASE_VIEW_ID } from './useBuildViewMenuItems'
import { ViewSettings } from '@shared/containers'

type Props = {
  viewType?: string
  projectName?: string
  workingSettings?: ViewSettings
  workingView?: ViewListItemModel
  dispatch?: any
}

export type UseBaseViewMutations = {
  onCreateBaseView: (isStudioScope: boolean) => Promise<void>
  onUpdateBaseView: (baseViewId: string, isStudioScope: boolean) => Promise<void>
  onDeleteBaseView: (baseViewId: string, isStudioScope: boolean) => Promise<void>
  onLoadBaseView: (isStudioScope: boolean) => Promise<void>
}

export const useBaseViewMutations = ({
  viewType,
  projectName,
  workingSettings,
  workingView,
  dispatch,
}: Props): UseBaseViewMutations => {
  const [createViewMutation] = useCreateViewMutation()
  const [updateViewMutation] = useUpdateViewMutation()
  const [deleteViewMutation] = useDeleteViewMutation()
  const [setDefaultViewMutation] = useSetDefaultViewMutation()

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

  const onLoadBaseView = useCallback(
    async (isStudioScope: boolean) => {
      try {
        if (!workingView?.id) {
          throw new Error('No working view available to update')
        }

        // Fetch the specific base view (project or studio)
        const baseViewPromise = dispatch(
          viewsQueries.endpoints.getBaseView.initiate(
            {
              viewType: viewType as string,
              projectName: isStudioScope ? undefined : projectName,
            },
            { subscribe: false, forceRefetch: true }
          )
        )
        const baseViewResult = await baseViewPromise
        const baseView = baseViewResult.data

        if (!baseView || !baseView.settings) {
          throw new Error('Base view not found or has no settings')
        }

        // Update the working view with the base view settings
        await updateViewMutation({
          viewId: workingView.id,
          viewType: viewType as string,
          projectName,
          payload: { settings: baseView.settings },
        }).unwrap()

        // Set the working view as the default view
        await setDefaultViewMutation({
          viewType: viewType as string,
          projectName,
          setDefaultViewRequestModel: { viewId: workingView.id },
        }).unwrap()

        const scope = isStudioScope ? 'Studio' : 'Project'
        toast.success(`Loaded ${scope} default view to working view`)
      } catch (error: any) {
        const scope = isStudioScope ? 'studio' : 'project'
        console.error(`Failed to load ${scope} base view:`, error)
        toast.error(`Failed to load ${scope} base view: ${error?.message || error}`)
      }
    },
    [
      workingView,
      updateViewMutation,
      setDefaultViewMutation,
      viewType,
      projectName,
      dispatch,
    ],
  )

  return {
    onCreateBaseView,
    onUpdateBaseView,
    onDeleteBaseView,
    onLoadBaseView,
  }
}
