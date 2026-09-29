import { activityFeedApi } from '@shared/api/generated'
import type { ActivityCategoriesResponseModel } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import type { AccessLevel } from '@shared/components/AccessUser/AccessUser'

const listTag = { type: 'category', id: 'LIST' } as const
const settingsTag = { type: 'addonSettings', id: 'powerpack' } as const

export type ActivityCategory = {
  name: string
  color: string // hex color code
  access: Record<string, AccessLevel>
  accessLevel: AccessLevel
}
type GetActivityCategoriesResult = ActivityCategory[]

type Definitions = DefinitionsFromApi<typeof activityFeedApi>
type TagTypes = TagTypesFromApi<typeof activityFeedApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getActivityCategories'> & {
  getActivityCategories: OverrideResultType<
    Definitions['getActivityCategories'],
    GetActivityCategoriesResult
  >
}

const categoriesApi = activityFeedApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getActivityCategories: {
      transformResponse: (res: ActivityCategoriesResponseModel) =>
        res.categories as ActivityCategory[],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ name }) => ({ type: 'category' as const, id: name })),
              listTag,
              settingsTag,
            ]
          : [listTag, settingsTag],
    },
  },
})

export type ProjectsCategories = { [projectName: string]: ActivityCategory[] }

// one entry per project, so a list of messages resolves its dots without a query per row
const projectsCategoriesApi = categoriesApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsCategories: build.query<ProjectsCategories, { projects: string[] }>({
      async queryFn({ projects = [] }, { dispatch }) {
        const entries = await Promise.all(
          projects.map(async (projectName) => {
            try {
              const categories = await dispatch(
                categoriesApi.endpoints.getActivityCategories.initiate({ projectName }),
              ).unwrap()
              return [projectName, categories] as const
            } catch {
              return [projectName, [] as ActivityCategory[]] as const
            }
          }),
        )

        return { data: Object.fromEntries(entries) }
      },
      providesTags: [listTag, settingsTag],
    }),
  }),
})

export const { useGetActivityCategoriesQuery } = categoriesApi
export const { useGetProjectsCategoriesQuery } = projectsCategoriesApi
