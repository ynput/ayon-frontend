import projectApi, { getProjectsGraphql } from './getProject'
import type { Tag } from '@shared/api/generated'
import { normalizeQueryError } from '@shared/api/base/queryError'

const patchProjectFromModel = (
  project: Record<string, any>,
  projectPatchModel: Record<string, any>,
) => {
  for (const [key, value] of Object.entries(projectPatchModel)) {
    if (key === 'attrib' && value && typeof value === 'object' && !Array.isArray(value)) {
      project.attrib = {
        ...project.attrib,
        ...value,
      }
      continue
    }

    project[key] = value
  }
}

const enhancedProjectApi = projectApi.enhanceEndpoints({
  endpoints: {
    deployProject: {
      invalidatesTags: () => [
        { type: 'projects', id: 'LIST' },
        { type: 'kanBanTask', id: 'LIST' },
        { type: 'project', id: 'LIST' },
      ],
    },
    deleteProject: {
      invalidatesTags: () => [
        { type: 'projects', id: 'LIST' },
        { type: 'project', id: 'LIST' },
      ],
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
      // Optimistically patch project list caches so table edits update instantly.
      async onQueryStarted({ projectName, projectPatchModel }, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            projectApi.util.updateQueryData('listProjects', { active: true }, (draft) => {
              const project = draft.find((p) => p.name === projectName)
              if (project) {
                patchProjectFromModel(project as Record<string, any>, projectPatchModel)
              }
            }),
          ),
          dispatch(
            projectApi.util.updateQueryData('listProjects', { active: undefined }, (draft) => {
              const project = draft.find((p) => p.name === projectName)
              if (project) {
                patchProjectFromModel(project as Record<string, any>, projectPatchModel)
              }
            }),
          ),
          dispatch(
            getProjectsGraphql.util.updateQueryData('getProjectsInfinite', {}, (draft) => {
              for (const page of draft.pages) {
                const project = page.projects.find((p) => p.name === projectName)
                if (!project) continue

                patchProjectFromModel(project as Record<string, any>, projectPatchModel)
              }
            }),
          ),
        ]

        try {
          await queryFulfilled
        } catch {
          patches.forEach((patch) => patch.undo())
        }
      },
    },
    setProjectBundle: {
      invalidatesTags: (_r, _e, { projectName }) => [
        { type: 'project', id: projectName },
        { type: 'addonSettingsList', id: 'LIST' },
      ],
    },
  },
})

const projectTagsApi = enhancedProjectApi.injectEndpoints({
  endpoints: (build) => ({
    // adds a tag to the project anatomy; the tags are saved as one list, so it is added to the
    // project's current tags rather than to the ones loaded earlier
    addProjectTag: build.mutation<void, { projectName: string; tag: Tag }>({
      queryFn: async ({ projectName, tag }, { dispatch }) => {
        const request = dispatch(
          projectApi.endpoints.getProject.initiate({ projectName }, { forceRefetch: true }),
        )
        try {
          const project = await request.unwrap()
          const tags = project.tags || []
          if (!tags.some((existing) => existing.name === tag.name)) {
            await dispatch(
              enhancedProjectApi.endpoints.updateProject.initiate({
                projectName,
                projectPatchModel: { tags: [...tags, tag] },
              }),
            ).unwrap()
          }
          return { data: undefined }
        } catch (error: any) {
          return { error: normalizeQueryError(error) }
        } finally {
          request.unsubscribe()
        }
      },
    }),
  }),
})

export const { useAddProjectTagMutation } = projectTagsApi

export const {
  useDeployProjectMutation,
  useDeleteProjectMutation,
  useSetProjectAnatomyMutation,
  useUpdateProjectMutation,
  useSetProjectBundleMutation,
} = enhancedProjectApi
export { projectApi as projectQueries }
