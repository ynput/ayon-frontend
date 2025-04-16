import { api } from '@api/rest/permissions'

const permissionsApi = api.enhanceEndpoints({
  endpoints: {
    getCurrentUserPermissions: {
      providesTags: (_result) => [{ type: 'userPermissions' }],
    },
    getCurrentUserProjectPermissions: {
      providesTags: (_result, _err, _args) => [{ type: 'userProjectPermissions' }],
    },
  },
})

export const { useGetCurrentUserPermissionsQuery, useGetCurrentUserProjectPermissionsQuery } =
  permissionsApi
export default permissionsApi
