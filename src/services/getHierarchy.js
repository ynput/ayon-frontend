import { ayonApi } from './ayon'

const getHierarchy = ayonApi.injectEndpoints({
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
})

export const { useGetHierarchyQuery } = getHierarchy
