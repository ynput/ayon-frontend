import {
  DeleteProjectActivityApiResponse,
  DeleteProjectActivityApiArg,
  ReviewableModel,
} from '@/api/rest'
import api from '@api'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const injectedEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    deleteReviewable: build.mutation<DeleteProjectActivityApiResponse, DeleteProjectActivityApiArg>(
      {
        queryFn: async (args, { dispatch }) => {
          try {
            // get list of installed addons
            const res = await dispatch(api.endpoints.deleteProjectActivity.initiate(args))

            if (res.error) {
              return { error: res.error as FetchBaseQueryError }
            }

            return { data: res.data }
          } catch (e: any) {
            const error = { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError
            return { error }
          }
        },
        invalidatesTags: (_result, _error, args) => [{ type: 'review', id: args.activityId }],
      },
    ),
  }),
})

const enhancedEndpoints = injectedEndpoints.enhanceEndpoints({
  endpoints: {
    // reviewables list is updated optimistically
    sortVersionReviewables: {
      async onQueryStarted(
        { projectName, versionId, sortReviewablesRequest },
        { dispatch, queryFulfilled },
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData(
            'getReviewablesForVersion',
            { projectName, versionId },
            (draft) => {
              const sortingOrder = sortReviewablesRequest.sort
              // Create a new array to store the reordered reviewables
              const newReviewables: ReviewableModel[] = []

              // Create a Set to track activityIds that are in the sortingOrder
              const orderedIds = new Set(sortingOrder)
              // Loop through each id in the sortingOrder array
              sortingOrder?.forEach((id) => {
                // Filter the reviewables that match the current activityId and push them to newReviewables
                draft.reviewables
                  ?.filter((r) => r.activityId === id)
                  .forEach((r) => newReviewables.push(r))
              })

              // Add remaining reviewables that were not in the sortingOrder to the end
              draft.reviewables?.forEach((r) => {
                if (!orderedIds.has(r.activityId)) {
                  newReviewables.push(r)
                }
              })

              // update draft
              draft.reviewables = newReviewables
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      // viewer list is updated through invalidation
      invalidatesTags: (_result, _error, args) => [{ type: 'viewer', id: args.versionId }],
    },
    updateReviewable: {
      invalidatesTags: (_result, _error, args) => [{ type: 'review', id: args.activityId }],
    },
  },
})

export const {
  useDeleteReviewableMutation,
  useSortVersionReviewablesMutation,
  useUpdateReviewableMutation,
} = enhancedEndpoints
