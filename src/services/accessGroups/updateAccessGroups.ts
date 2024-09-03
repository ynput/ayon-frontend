import api from './getAccessGroups'

const setAccessGroups = api.injectEndpoints({
  endpoints: (build) => ({
    createAccessGroup: build.mutation({
      query: ({ name }) => ({
        url: `/api/accessGroups/${name}/_`,
        method: 'PUT',
        body: {},
      }),
      invalidatesTags: [{ type: 'accessGroup', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
})

export const { useCreateAccessGroupMutation } = setAccessGroups

const updateAccessGroupsApi = api.enhanceEndpoints({
  endpoints: {
    saveAccessGroup: {
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    },
    deleteAccessGroup: {
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    },
  },
})

export const { useSaveAccessGroupMutation, useDeleteAccessGroupMutation } = updateAccessGroupsApi
