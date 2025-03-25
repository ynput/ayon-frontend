import { api } from '@api/rest/permissions'

const permissionsApi = api.enhanceEndpoints({
  endpoints: {
    getCurrentUserPermissions: {
      providesTags: (result) =>[
        { type: 'userPermissions' },
      ]
    },
    getCurrentUserProjectPermissions: {
      providesTags: (_result, _err, args ) => [
        { type: 'userProjectPermissions' },
      ],
    },
  },
})

export const { useGetCurrentUserPermissionsQuery, useGetCurrentUserProjectPermissionsQuery } = permissionsApi
export default permissionsApi

