import { usersApi } from '@shared/api/generated'

const enhancedApi = usersApi.enhanceEndpoints({
  endpoints: {
    getMyPermissions: {
      providesTags: (_result) => [{ type: 'userPermissions' }],
    },
    getMyProjectPermissions: {
      providesTags: (_result, _err, _args) => [{ type: 'userProjectPermissions' }],
    },
  },
})

export const { useGetMyPermissionsQuery, useGetMyProjectPermissionsQuery } = enhancedApi
export { enhancedApi as permissionsQueries }
