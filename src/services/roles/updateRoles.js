import { ayonApi } from '../ayon'

const getRoles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    createRole: build.mutation({
      query: ({ name }) => ({
        url: `/api/roles/${name}/_`,
        method: 'PUT',
        body: {},
      }),
      invalidatesTags: ['roles'],
    }),
    updateRole: build.mutation({
      query: ({ name, projectName = '_', data }) => ({
        url: `/api/roles/${name}/${projectName}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (res, error, { name }) => [{ type: 'role', id: name }],
    }),
    deleteRole: build.mutation({
      query: ({ name, projectName = '_' }) => ({
        url: `/api/roles/${name}/${projectName}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['roles'],
    }),
  }),
})

export const { useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } = getRoles
