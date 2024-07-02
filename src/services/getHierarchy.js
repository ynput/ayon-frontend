import api from '@api'

const getHierarchy = api.injectEndpoints({
  endpoints: (build) => ({
    getHierarchy: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/hierarchy`,
      }),
      transformResponse: (response) => response.hierarchy,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: ['hierarchy'],
    }),
  }),
  overrideExisting: true,
})

export const { useGetHierarchyQuery } = getHierarchy
