import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import type { Tag } from '@shared/api/generated'
import { projectQueries } from '../project'
import { dashboardQueries } from '../userDashboard'

// Puts the project's tags into the loaded project data. Patched in place, as refetching the
// project shows the whole project as loading (ProjectContext's isLoading includes isFetching).
const patchProjectTags = (
  projectName: string,
  tags: Tag[],
  dispatch: ThunkDispatch<any, any, UnknownAction>,
  getState: () => any,
) => {
  const patches = [
    dispatch(
      projectQueries.util.updateQueryData('getProject', { projectName }, (draft) => {
        draft.tags = tags
      }),
    ),
    dispatch(
      projectQueries.util.updateQueryData('getProjectAnatomy', { projectName }, (draft) => {
        draft.tags = tags
      }),
    ),
  ]
  // the details panel's project info
  const infoArgs = dashboardQueries.util.selectCachedArgsForQuery(getState(), 'getProjectsInfo')
  for (const args of infoArgs) {
    if (!args.projects?.includes(projectName)) continue
    patches.push(
      dispatch(
        dashboardQueries.util.updateQueryData('getProjectsInfo', args, (draft) => {
          const project = draft[projectName]
          if (!project) return
          project.tags = tags
          if (project.anatomy) project.anatomy.tags = tags
        }),
      ),
    )
  }
  return patches
}

const projectTagsApi = projectQueries.injectEndpoints({
  endpoints: (build) => ({
    // adds the tag to the project anatomy, or changes the colour of the one there
    setProjectTagColor: build.mutation<void, { projectName: string; tag: Tag }>({
      queryFn: async ({ projectName, tag }, { dispatch, getState }, _extra, baseQuery) => {
        // the tags are saved as one list: change the project's current tags, not the loaded ones
        const project = await baseQuery({ url: `/api/projects/${projectName}`, method: 'GET' })
        if (project.error) return { error: project.error }
        const current = (project.data as { tags?: Tag[] })?.tags || []
        const tags = current.some((existing) => existing.name === tag.name)
          ? current.map((existing) =>
              existing.name === tag.name ? { ...existing, color: tag.color } : existing,
            )
          : [...current, tag]

        const patches = patchProjectTags(projectName, tags, dispatch, getState)
        const saved = await baseQuery({
          url: `/api/projects/${projectName}`,
          method: 'PATCH',
          body: { tags },
        })
        if (saved.error) {
          patches.forEach((patch) => patch.undo())
          return { error: saved.error }
        }
        return { data: undefined }
      },
    }),
  }),
})

export const { useSetProjectTagColorMutation } = projectTagsApi
