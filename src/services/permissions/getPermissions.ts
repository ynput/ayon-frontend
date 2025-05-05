import { permissionsApi } from '@shared/api'

const enhancedApi = permissionsApi.enhanceEndpoints({
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
export default enhancedApi
