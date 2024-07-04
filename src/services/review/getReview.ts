import api from '@api'

const enhancedReview = api.enhanceEndpoints({
  endpoints: {
    getReviewablesForProduct: {},
  },
})

export const { useGetReviewablesForProductQuery } = enhancedReview
