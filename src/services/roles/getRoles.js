import { ayonApi } from '../ayon'

const getRoles = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getRoles: build.query({
      query: (args) => ({
        url: '/api/roles/' + (args?.projectName || '_'),
      }),
      providesTags: ['roles'],
    }),
    getRole: build.query({
      query: ({ roleName, projectName }) => ({
        url: `/api/roles/${roleName}/${projectName || '_'}`,
      }),
      providesTags: (res, error, { roleName }) => (error ? [] : [{ type: 'role', id: roleName }]),
    }),
    getRolesSchema: build.query({
      query: () => ({
        url: '/api/roles/_schema',
      }),
    }),
  }),
})

export const { useGetRolesQuery, useGetRoleQuery, useGetRolesSchemaQuery } = getRoles
