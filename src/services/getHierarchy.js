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
    getProjectFolders: build.query({
      query: ({ projectName, withAttrib }) => ({
        url: `/api/projects/${projectName}/folders${withAttrib ? '?attrib=true' : ''}`,
      }),
      transformResponse: (response) => response.folders,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: ['hierarchy'],
    }),
  }),
})

export const { useGetHierarchyQuery, useGetProjectFoldersQuery } = getHierarchy
