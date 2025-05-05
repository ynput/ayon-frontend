import { cloudApi } from '@shared/api'

const enhancedApi = cloudApi.enhanceEndpoints({
  endpoints: {
    getYnputCloudInfo: {
      providesTags: ['connections'],
    },
    setYnputCloudKey: {
      invalidatesTags: ['connections'],
    },
    deleteYnputCloudKey: {
      invalidatesTags: ['connections'],
    },
    getFeedbackVerification: {
      providesTags: [{ type: 'feedback', id: 'LIST' }],
    },
  },
})

export const {
  useGetYnputCloudInfoQuery,
  useSetYnputCloudKeyMutation,
  useDeleteYnputCloudKeyMutation,
  useGetFeedbackVerificationQuery,
} = enhancedApi
