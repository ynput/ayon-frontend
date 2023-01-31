import { ayonApi } from './ayon'

const getProject = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProject: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'GET',
      }),
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: () => ['project'],
    }),
    getAllProjects: build.query({
      query: () => ({
        url: `/api/projects`,
        method: 'GET',
      }),
      transformResponse: (res) => res.projects,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: () => ['project'],
    }),
    getProjectAnatomy: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/anatomy`,
      }),
    }),
  }),
})

export const { useGetProjectQuery, useGetAllProjectsQuery, useGetProjectAnatomyQuery } = getProject
