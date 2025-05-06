import { authenticationApi } from '@shared/api/generated'

const getAuthApi = authenticationApi.enhanceEndpoints({
  endpoints: {
    createSession: {},
    getUserPools: {
      providesTags: [{ type: 'userPool', id: 'LIST' }],
    },
  },
})

export const { useCreateSessionMutation, useGetUserPoolsQuery } = getAuthApi
export { getAuthApi as authenticationQueries }
