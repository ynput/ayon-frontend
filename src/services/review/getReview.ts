import api from '@api'

const enhancedReview = api.enhanceEndpoints({
  endpoints: {
    listReviewables: {},
  },
})

export const { useListReviewablesQuery } = enhancedReview
