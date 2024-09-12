import { api } from '@api/rest/activities'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    createReactionToActivity: {
      invalidatesTags: (_result, _error, args) => [{ type: 'activity', id: args.activityId }],
    },
    deleteReactionToActivity: {
      invalidatesTags: (_result, _error, args) => [{ type: 'activity', id: args.activityId }],
    },
  },
})

export const {
  useCreateReactionToActivityMutation,
  useDeleteReactionToActivityMutation
} = enhancedApi

