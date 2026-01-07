import { ViewListItemModel } from '@shared/api/generated'
import { getScopeTag, getViewsApi } from './getViews'
import { v4 as uuidv4 } from 'uuid'

const updateViewsApi = getViewsApi.enhanceEndpoints({
  endpoints: {
    createView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getState }) => {
        const { payload } = arg
        const state = getState()
        // @ts-expect-error - user is not typed in the state
        const user = state.user?.name

        // Optimistically update the view list
        const patch = dispatch(
          getViewsApi.util.updateQueryData(
            'listViews',
            { viewType: arg.viewType, projectName: arg.projectName },
            (draft) => {
              const newView: ViewListItemModel = {
                ...payload,
                working: payload.working || false,
                scope: arg.projectName ? 'project' : 'studio',
                visibility: 'private',
                position: draft.length + 1, // Add to the end of the list
                owner: user,
                accessLevel: 30,
              }
              if (payload.working) {
                // For working views, find and replace the existing working view
                const existingWorkingIndex = draft.findIndex((view) => view.working === true)
                if (existingWorkingIndex !== -1) {
                  // Keep the existing ID but update all other properties
                  const existingId = draft[existingWorkingIndex].id
                  draft[existingWorkingIndex] = { ...newView, id: existingId }
                } else {
                  // No existing working view, add the new one
                  draft.push(newView)
                }
              } else {
                // For non-working views, add to the list as usual
                draft.push(newView)
              }

              // finally sort the view by position and then by label
              draft.sort((a, b) => {
                if (a.position !== b.position) {
                  return a.position - b.position
                }
                return a.label.localeCompare(b.label)
              })
            },
          ),
        )

        // Also update the getWorkingView cache if this is a working view
        let workingViewPatch
        if (payload.working) {
          workingViewPatch = dispatch(
            getViewsApi.util.updateQueryData(
              'getWorkingView',
              { viewType: arg.viewType, projectName: arg.projectName },
              (draft) => {
                // Preserve the existing ID if there's already a working view
                const existingId = draft?.id
                const updatedWorkingView = {
                  ...payload,
                  working: true,
                  scope: arg.projectName ? 'project' : 'studio',
                  visibility: 'private',
                  owner: user,
                  ...(existingId && { id: existingId }), // Keep existing ID if it exists
                }
                // Update the working view cache with the new view data
                Object.assign(draft, updatedWorkingView)
              },
            ),
          )
        }

        let baseViewPatchApplied = false

        if (payload.label === '__base__') {
          const newBaseView = {
            id: uuidv4(),
            ...payload,
            working: false,
            scope: arg.projectName ? 'project' : 'studio',
            visibility: 'private',
            owner: user,
            accessLevel: 30,
            position: 0,
          }

          dispatch(
            getViewsApi.util.upsertQueryData(
              'getBaseView',
              { viewType: arg.viewType, projectName: arg.projectName },
              newBaseView as any,
            ),
          )

          baseViewPatchApplied = true
        }

        try {
          await queryFulfilled
        } catch (error) {
          patch.undo()
          if (workingViewPatch) workingViewPatch.undo()
          // ❌ no undo for base view
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
      // updates the view list cache for a specific view type and project
      invalidatesTags: (_r, _e, { viewType, projectName, payload }) => [
        { type: 'view', id: payload.id },
        getScopeTag(viewType, projectName),
      ],
    },
    updateView: {
      transformErrorResponse: (error: any) => error.data?.detail,
      invalidatesTags: (_r, _e, { viewType, projectName, viewId }) => [
        { type: 'view', id: viewId },
        getScopeTag(viewType, projectName),
      ],
    },
    deleteView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getState }) => {
        const { viewId, projectName, viewType } = arg
        const state = getState()

        // Optimistically remove the view from the list
        const patches: any[] = []

        patches.push(
          dispatch(
            getViewsApi.util.updateQueryData('listViews', { viewType, projectName }, (draft) => {
              return draft.filter((view) => view.id !== viewId)
            }),
          ),
        )

        // Check both project and studio level for base and default views
        const scopesToCheck = [
          { projectName },
          { projectName: undefined }, // studio level
        ]
        const queriesToCheck = ['getBaseView', 'getDefaultView'] as const

        for (const scope of scopesToCheck) {
          for (const queryName of queriesToCheck) {
            const currentView = getViewsApi.endpoints[queryName].select({
              viewType,
              projectName: scope.projectName,
            })(state)

            if (currentView?.isSuccess && currentView.data?.id === viewId) {
              patches.push(
                dispatch(
                  getViewsApi.util.updateQueryData(
                    queryName,
                    { viewType, projectName: scope.projectName },
                    () => null as any,
                  ),
                ),
              )
            }
          }
        }

        try {
          await queryFulfilled
        } catch (error) {
          // If the query failed, roll back all optimistic updates
          patches.forEach((patch) => patch.undo())
          console.error('Failed to delete view:', error)
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
      // updates the view list cache for a specific view type and project
      invalidatesTags: (_r, _e, { viewType, projectName, viewId }) => [
        { type: 'view', id: viewId },
        getScopeTag(viewType, projectName),
        getScopeTag(viewType, undefined),
      ],
    },
    setDefaultView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getState }) => {
        const { setDefaultViewRequestModel, projectName, viewType } = arg
        const { viewId } = setDefaultViewRequestModel
        const state = getState()
        // get current state of default view
        const currentDefaultView = getViewsApi.endpoints.getDefaultView.select({
          viewType,
          projectName,
        })(state)

        // check if there is even a cache for the default view
        if (currentDefaultView?.isSuccess && currentDefaultView.data?.id) {
          // Optimistically update the default view
          const patch = dispatch(
            getViewsApi.util.updateQueryData(
              'getDefaultView',
              { viewType, projectName },
              (draft) => {
                if (draft) {
                  // Try to find the view in the listViews cache
                  const listViewData = getViewsApi.endpoints.listViews.select({
                    viewType,
                    projectName,
                  })(state)
                  const view = listViewData?.data?.find((v) => v.id === viewId)

                  if (view) {
                    // If the view is found in the listViews cache, update the getDefaultView cache with the full view data
                    Object.assign(draft, view)
                  } else {
                    // If the view is not found, only update the ID
                    draft.id = viewId
                  }
                }
              },
            ),
          )

          try {
            await queryFulfilled
          } catch (error) {
            // If the query failed, we need to roll back the optimistic update
            patch.undo()
            console.error('Failed to set default view:', error)
          }
        } else {
          console.warn(
            'No current default view found, skipping optimistic update and invalidating default view cache',
          )
          // If there is no current default view, we skip the optimistic update
          // it will be handled by the invalidation below
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
      // updates the default view cache for a specific view type and project
      invalidatesTags: (_r, _e, { viewType, projectName, setDefaultViewRequestModel }) => [
        { type: 'view', id: setDefaultViewRequestModel.viewId },
        getScopeTag(viewType, projectName),
      ],
    },
  },
})

export const {
  useCreateViewMutation,
  useUpdateViewMutation,
  useDeleteViewMutation,
  useSetDefaultViewMutation,
} = updateViewsApi
export { updateViewsApi as viewsQueries }
