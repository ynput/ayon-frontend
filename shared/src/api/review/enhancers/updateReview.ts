import {
  api as activitiesApi,
  DeleteProjectActivityApiResponse,
  DeleteProjectActivityApiArg,
} from '../../activities'
import { getReviewApi } from './getReview'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { ReviewableResponse } from './types'

const injectedEndpoints = getReviewApi.injectEndpoints({
  endpoints: (build) => ({
    deleteReviewable: build.mutation<DeleteProjectActivityApiResponse, DeleteProjectActivityApiArg>(
      {
        queryFn: async (args, { dispatch }) => {
          try {
            // delete reviewable activity
            const res = await dispatch(activitiesApi.endpoints.deleteProjectActivity.initiate(args))

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
          getReviewApi.util.updateQueryData(
            'getReviewablesForVersion',
            { projectName, versionId },
            (draft) => {
              const sortingOrder = sortReviewablesRequest.sort
              // Create a new array to store the reordered reviewables
              const newReviewables: ReviewableResponse[] = []

              // Create a Set to track activityIds that are in the sortingOrder
              const orderedIds = new Set(sortingOrder)
              // Loop through each id in the sortingOrder array
              sortingOrder?.forEach((id) => {
                // Filter the reviewables that match the current activityId and push them to newReviewables
                draft.reviewables
                  ?.filter((r: ReviewableResponse) => r.activityId === id)
                  .forEach((r: ReviewableResponse) => newReviewables.push(r))
              })

              // Add remaining reviewables that were not in the sortingOrder to the end
              draft.reviewables?.forEach((r: ReviewableResponse) => {
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
