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

// the colour the anatomy gives a tag without one (ayon-backend settings/anatomy/tags.py)
export const DEFAULT_TAG_COLOR = '#cacaca'

const projectTagsApi = projectQueries.injectEndpoints({
  endpoints: (build) => ({
    // adds the tags to the project anatomy, and sets the colours of the ones given with a colour
    saveProjectTags: build.mutation<void, { projectName: string; tags: Tag[] }>({
      queryFn: async ({ projectName, tags }, { dispatch, getState }, _extra, baseQuery) => {
        // the tags are saved as one list: change the project's current tags, not the loaded ones
        const project = await baseQuery({ url: `/api/projects/${projectName}`, method: 'GET' })
        if (project.error) return { error: project.error }
        const next = [...((project.data as { tags?: Tag[] })?.tags || [])]
        let changed = false
        for (const tag of tags) {
          const index = next.findIndex((existing) => existing.name === tag.name)
          if (index === -1) {
            next.push({ name: tag.name, color: tag.color || DEFAULT_TAG_COLOR })
            changed = true
          } else if (tag.color && next[index].color !== tag.color) {
            next[index] = { ...next[index], color: tag.color }
            changed = true
          }
        }
        if (!changed) return { data: undefined }

        const patches = patchProjectTags(projectName, next, dispatch, getState)
        const saved = await baseQuery({
          url: `/api/projects/${projectName}`,
          method: 'PATCH',
          body: { tags: next },
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

export const { useSaveProjectTagsMutation } = projectTagsApi
