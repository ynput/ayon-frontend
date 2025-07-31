import { getViewsApi } from './getViews'

const updateViewsApi = getViewsApi.enhanceEndpoints({
  endpoints: {
    createView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { payload } = arg
        // Optimistically update the view list with the new view
        const patch = dispatch(
          getViewsApi.util.updateQueryData(
            'listViews',
            { viewType: arg.viewType, projectName: arg.projectName },
            (draft) => {
              draft.push(payload)
            },
          ),
        )

        try {
          await queryFulfilled
        } catch (error) {
          // If the query failed, we need to roll back the optimistic update
          patch.undo()
          console.error('Failed to create view:', error)
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
    },
  },
})

export const { useCreateViewMutation } = updateViewsApi
export { updateViewsApi as viewsQueries }
