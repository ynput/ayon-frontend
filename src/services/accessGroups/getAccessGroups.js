import api from '@api'

const getAccessGroups = api.rest.injectEndpoints({
  endpoints: (build) => ({
    getAccessGroups: build.query({
      query: (args) => ({
        url: '/api/accessGroups/' + (args?.projectName || '_'),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ name }) => ({ type: 'accessGroup', id: name })),
              { type: 'accessGroup', id: 'LIST' },
            ]
          : [{ type: 'accessGroup', id: 'LIST' }],
    }),
    getAccessGroup: build.query({
      query: ({ name, projectName }) => ({
        url: `/api/accessGroups/${name}/${projectName || '_'}`,
      }),
      providesTags: (result, err, { name }) =>
        result
          ? [
              { type: 'accessGroup', id: name },
              { type: 'accessGroup', id: 'LIST' },
            ]
          : [{ type: 'accessGroup', id: 'LIST' }],
    }),
    getAccessGroupSchema: build.query({
      query: () => ({
        url: '/api/accessGroups/_schema',
      }),
    }),
  }),
  overrideExisting: true,
})

export const { useGetAccessGroupsQuery, useGetAccessGroupQuery, useGetAccessGroupSchemaQuery } =
  getAccessGroups
