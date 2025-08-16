import projectApi from './getProject'

const enhancedProjectApi = projectApi.enhanceEndpoints({
  endpoints: {
    deployProject: {
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      invalidatesTags: () => [
        { type: 'projects', id: 'LIST' },
        { type: 'kanBanTask', id: 'LIST' },
      ],
    },
    deleteProject: {
      invalidatesTags: () => [{ type: 'projects', id: 'LIST' }],
    },
    setProjectAnatomy: {
      invalidatesTags: (result, error, { projectName }) =>
        error ? [] : [{ type: 'project', id: projectName }],
    },
    updateProject: {
      invalidatesTags: (result, error, { projectName, projectPatchModel }) =>
        error
          ? []
          : 'active' in projectPatchModel
          ? // if active is updated, invalidate all projects
            ['project']
          : // if not, invalidate only the updated project
            [
              { type: 'project', id: projectName },
              { type: 'projects', id: 'LIST' },
            ],
      transformErrorResponse: (error: any) => error.data.detail,
    },
    setProjectBundle: {
      invalidatesTags: (_r, _e, { projectName }) => [
        { type: 'project', id: projectName },
        { type: 'addonSettingsList', id: 'LIST' },
      ],
    },
  },
})

export const {
  useDeployProjectMutation,
  useDeleteProjectMutation,
  useSetProjectAnatomyMutation,
  useUpdateProjectMutation,
  useSetProjectBundleMutation,
} = enhancedProjectApi
export { projectApi as projectQueries }
