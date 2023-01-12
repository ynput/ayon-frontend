import { ayonApi } from './ayon'

const getProject = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProject: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'GET',
      }),

      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),
  }),
})

export const { useGetProjectQuery } = getProject
