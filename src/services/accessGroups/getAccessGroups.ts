import { api } from '@api/rest/accessGroups'

const accessGroupsApi = api.enhanceEndpoints({
  endpoints: {
    getAccessGroups: {
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ name }) => ({ type: 'accessGroup', id: name })),
              { type: 'accessGroup', id: 'LIST' },
            ]
          : [{ type: 'accessGroup', id: 'LIST' }],
    },
    getAccessGroup: {
      providesTags: (_result, _err, { accessGroupName }) => [
        { type: 'accessGroup', id: accessGroupName },
        { type: 'accessGroup', id: 'LIST' },
      ],
    },
    getAccessGroupSchema: {},
  },
})

export const { useGetAccessGroupsQuery, useGetAccessGroupQuery, useGetAccessGroupSchemaQuery } =
  accessGroupsApi

export default accessGroupsApi
