import { permissionsApi } from '@shared/api'

const enhancedApi = permissionsApi.enhanceEndpoints({
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
  enhancedApi
export default enhancedApi
