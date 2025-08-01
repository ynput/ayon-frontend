import { ViewListItemModel } from '@shared/api/generated'
import { getScopeTag, getViewsApi } from './getViews'

const updateViewsApi = getViewsApi.enhanceEndpoints({
  endpoints: {
    createView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getState }) => {
        const { payload } = arg
        const state = getState()
        // @ts-expect-error - user is not typed in the state
        const user = state.user.name

        // Optimistically update the view list
        const patch = dispatch(
          getViewsApi.util.updateQueryData(
            'listViews',
            { viewType: arg.viewType, projectName: arg.projectName },
            (draft) => {
              const newView: ViewListItemModel = {
                ...payload,
                personal: payload.personal || false,
                scope: arg.projectName ? 'project' : 'studio',
                visibility: 'private',
                position: draft.length + 1, // Add to the end of the list
                owner: user,
              }
              if (payload.personal) {
                // For personal views, find and replace the existing personal view
                const existingPersonalIndex = draft.findIndex((view) => view.personal === true)
                if (existingPersonalIndex !== -1) {
                  // Keep the existing ID but update all other properties
                  const existingId = draft[existingPersonalIndex].id
                  draft[existingPersonalIndex] = { ...newView, id: existingId }
                } else {
                  // No existing personal view, add the new one
                  draft.push(newView)
                }
              } else {
                // For non-personal views, add to the list as usual
                draft.push(newView)
              }
            },
          ),
        )

        // Also update the getPersonalView cache if this is a personal view
        let personalViewPatch
        if (payload.personal) {
          personalViewPatch = dispatch(
            getViewsApi.util.updateQueryData(
              'getPersonalView',
              { viewType: arg.viewType, projectName: arg.projectName },
              (draft) => {
                // Preserve the existing ID if there's already a personal view
                const existingId = draft?.id
                const updatedPersonalView = {
                  ...payload,
                  personal: true,
                  scope: arg.projectName ? 'project' : 'studio',
                  visibility: 'private',
                  owner: user,
                  ...(existingId && { id: existingId }), // Keep existing ID if it exists
                }
                // Update the personal view cache with the new view data
                Object.assign(draft, updatedPersonalView)
              },
            ),
          )
        }

        try {
          await queryFulfilled
        } catch (error) {
          // If the query failed, we need to roll back the optimistic updates
          patch.undo()
          if (personalViewPatch) {
            personalViewPatch.undo()
          }
          console.error('Failed to create view:', error)
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
      // updates the view list cache for a specific view type and project
      invalidatesTags: (_r, _e, { viewType, projectName, payload }) => [
        { type: 'view', id: payload.id },
        getScopeTag(viewType, projectName),
      ],
    },
    deleteView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { viewId, projectName, viewType } = arg
        // Optimistically remove the view from the list
        const patch = dispatch(
          getViewsApi.util.updateQueryData('listViews', { viewType, projectName }, (draft) => {
            return draft.filter((view) => view.id !== viewId)
          }),
        )

        try {
          await queryFulfilled
        } catch (error) {
          // If the query failed, we need to roll back the optimistic update
          patch.undo()
          console.error('Failed to delete view:', error)
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
      // updates the view list cache for a specific view type and project
      invalidatesTags: (_r, _e, { viewType, projectName, viewId }) => [
        { type: 'view', id: viewId },
        getScopeTag(viewType, projectName),
      ],
    },
    setDefaultView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled, getState }) => {
        const { setDefaultViewRequestModel, projectName, viewType } = arg
        const { viewId } = setDefaultViewRequestModel

        // Optimistically update the default view
        const patch = dispatch(
          getViewsApi.util.updateQueryData('getDefaultView', { viewType, projectName }, (draft) => {
            if (draft) {
              // Try to find the view in the listViews cache
              const state = getState()
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
          }),
        )

        try {
          await queryFulfilled
        } catch (error) {
          // If the query failed, we need to roll back the optimistic update
          patch.undo()
          console.error('Failed to set default view:', error)
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

export const { useCreateViewMutation, useDeleteViewMutation, useSetDefaultViewMutation } =
  updateViewsApi
export { updateViewsApi as viewsQueries }
