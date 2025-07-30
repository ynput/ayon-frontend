import { getViewsApi } from './getViews'

const updateViewsApi = getViewsApi.enhanceEndpoints({
  endpoints: {
    createView: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { payload } = arg
          // Optimistically update the view list with the new view
          dispatch(
            getViewsApi.util.updateQueryData(
              'getViewList',
              { viewType: arg.viewType, project: arg.project },
              (draft) => {
                draft.push(payload)
              },
            ),
          )
        } catch (error) {
          console.error('Failed to create view:', error)
        }
      },
      transformErrorResponse: (error: any) => error.data?.detail,
    },
  },
})

export const { useCreateViewMutation } = updateViewsApi
export { updateViewsApi as viewsQueries }
