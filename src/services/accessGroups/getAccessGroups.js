import { ayonApi } from '../ayon'

const getAccessGroups = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAccessGroups: build.query({
      query: (args) => ({
        url: '/api/accessGroups/' + (args?.projectName || '_'),
      }),
      providesTags: ['accessGroups'],
    }),
    getAccessGroup: build.query({
      query: ({ name, projectName }) => ({
        url: `/api/accessGroups/${name}/${projectName || '_'}`,
      }),
      providesTags: (res, error, { name }) => (error ? [] : [{ type: 'accessGroup', id: name }]),
    }),
    getAccessGroupSchema: build.query({
      query: () => ({
        url: '/api/accessGroups/_schema',
      }),
    }),
  }),
})

export const { useGetAccessGroupsQuery, useGetAccessGroupQuery, useGetAccessGroupSchemaQuery } =
  getAccessGroups
