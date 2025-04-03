import { api } from '@api/rest/cloud'

const cloudApi = api.enhanceEndpoints({
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
} = cloudApi
