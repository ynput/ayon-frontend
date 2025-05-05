import { authApi } from '@shared/api/generated'

const getAuthApi = authApi.enhanceEndpoints({
  endpoints: {
    getSiteInfo: {
      providesTags: ['info'],
    },
    createSession: {},
    getUserPools: {
      providesTags: [{ type: 'userPool', id: 'LIST' }],
    },
    getCurrentUser: {
      providesTags: [{ type: 'user', id: 'LIST' }],
    },
  },
})

export const {
  useGetSiteInfoQuery,
  useLazyGetSiteInfoQuery,
  useCreateSessionMutation,
  useGetUserPoolsQuery,
  useGetCurrentUserQuery,
} = getAuthApi
export { getAuthApi as authQueries }
