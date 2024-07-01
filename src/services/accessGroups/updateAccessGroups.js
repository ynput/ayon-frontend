import api from '@api'

const setAccessGroups = api.rest.injectEndpoints({
  endpoints: (build) => ({
    createAccessGroup: build.mutation({
      query: ({ name }) => ({
        url: `/api/accessGroups/${name}/_`,
        method: 'PUT',
        body: {},
      }),
      invalidatesTags: [{ type: 'accessGroup', id: 'LIST' }],
    }),
    updateAccessGroup: build.mutation({
      query: ({ name, projectName = '_', data }) => ({
        url: `/api/accessGroups/${name}/${projectName}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    }),
    deleteAccessGroup: build.mutation({
      query: ({ name, projectName = '_' }) => ({
        url: `/api/accessGroups/${name}/${projectName}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'accessGroup', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
})

export const {
  useCreateAccessGroupMutation,
  useUpdateAccessGroupMutation,
  useDeleteAccessGroupMutation,
} = setAccessGroups
