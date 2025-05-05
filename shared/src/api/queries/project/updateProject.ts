import api from './getProject'

const projectApi = api.injectEndpoints({
  endpoints: (build) => ({
    createProject: build.mutation({
      query: ({ name, code, anatomy, library }) => ({
        url: `/api/projects`,
        method: 'POST',
        body: {
          name,
          code,
          anatomy,
          library,
        },
      }),
      // @ts-ignore
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      invalidatesTags: () => [
        { type: 'projects', id: 'LIST' },
        { type: 'kanBanTask', id: 'LIST' },
      ],
    }),
    deleteProject: build.mutation({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => [{ type: 'projects', id: 'LIST' }],
    }),
    updateProjectAnatomy: build.mutation({
      query: ({ projectName, anatomy }) => ({
        url: `/api/projects/${projectName}/anatomy`,
        method: 'POST',
        body: anatomy,
      }),
      invalidatesTags: (result, error, { projectName }) =>
        error ? [] : [{ type: 'project', id: projectName }],
    }),
    updateProject: build.mutation({
      query: ({ projectName, update }) => ({
        url: `/api/projects/${projectName}`,
        method: 'PATCH',
        body: update,
      }),
      invalidatesTags: (result, error, { projectName, update }) =>
        error
          ? []
          : 'active' in update
          ? // if active is updated, invalidate all projects
            ['project']
          : // if not, invalidate only the updated project
            [
              { type: 'project', id: projectName },
              { type: 'projects', id: 'LIST' },
            ],
    }),
    updateProjectUsers: build.mutation({
      query: ({ projectName, userName, update }) => ({
        url: `/api/projects/${projectName}/users/${userName}`,
        method: 'PATCH',
        body: update,
      }),
    }),
  }),
  overrideExisting: true,
})

export const {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectAnatomyMutation,
  useUpdateProjectMutation,
  useUpdateProjectUsersMutation,
} = projectApi
export { projectApi as projectQueries }
