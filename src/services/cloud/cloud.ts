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
  },
})

export const {
  useGetYnputCloudInfoQuery,
  useSetYnputCloudKeyMutation,
  useDeleteYnputCloudKeyMutation,
} = cloudApi
