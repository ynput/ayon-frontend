import api from '@api'

const enhancedReview = api.enhanceEndpoints({
  endpoints: {
    getReviewablesForProduct: {},
    getReviewablesForVersion: {
      providesTags: (result, _error, { versionId }) =>
        result
          ? [
              { type: 'review', id: versionId },
              ...(result.reviewables?.map((reviewable) => ({
                type: 'review',
                id: reviewable.activityId,
              })) || []),
            ]
          : [{ type: 'review', id: versionId }],
    },
  },
})

export const { useGetReviewablesForProductQuery, useGetReviewablesForVersionQuery } = enhancedReview
