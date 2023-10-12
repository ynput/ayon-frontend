import { ayonApi } from '../ayon'

const setAccessGroups = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    createAccessGroup: build.mutation({
      query: ({ name }) => ({
        url: `/api/accessGroups/${name}/_`,
        method: 'PUT',
        body: {},
      }),
      invalidatesTags: ['accessGroups'],
    }),
    updateAccessGroup: build.mutation({
      query: ({ name, projectName = '_', data }) => ({
        url: `/api/accessGroups/${name}/${projectName}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (res, error, { name }) => [{ type: 'accessGroup', id: name }],
    }),
    deleteAccessGroup: build.mutation({
      query: ({ name, projectName = '_' }) => ({
        url: `/api/accessGroups/${name}/${projectName}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['accessGroups'],
    }),
  }),
})

export const {
  useCreateAccessGroupMutation,
  useUpdateAccessGroupMutation,
  useDeleteAccessGroupMutation,
} = setAccessGroups
