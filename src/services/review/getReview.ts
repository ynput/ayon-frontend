import api from '@api'

const enhancedReview = api.enhanceEndpoints({
  endpoints: {
    getReviewablesForProduct: {},
    getReviewablesForVersion: {},
  },
})

export const { useGetReviewablesForProductQuery, useGetReviewablesForVersionQuery } = enhancedReview
