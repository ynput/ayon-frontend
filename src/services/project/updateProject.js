import { ayonApi } from '../ayon'

const updateProject = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    createProject: build.mutation({
      query: ({ name, code, anatomy }) => ({
        url: `/api/projects`,
        method: 'POST',
        body: {
          name,
          code,
          anatomy,
        },
      }),
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      async onQueryStarted({ ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getAllProjects', undefined, (draft) => {
            const newProject = { name: patch.name, code: patch.code }
            draft.push(newProject)
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: () => ['projects'],
    }),
    deleteProject: build.mutation({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => ['projects'],
    }),
    updateProjectAnatomy: build.mutation({
      query: ({ projectName, anatomy }) => ({
        url: `/api/projects/${projectName}/anatomy`,
        method: 'POST',
        body: anatomy,
      }),
      invalidatesTags: (result, error, { projectName }) => [{ type: 'project', name: projectName }],
    }),
  }),
})

export const {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectAnatomyMutation,
} = updateProject
