import { ActivityCategoriesResponseModel, activityFeedApi } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { AccessLevel } from '@shared/components'

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
      transformErrorResponse: (error: any) => error.data?.detail || 'An error occurred.',
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

export const { useGetActivityCategoriesQuery } = categoriesApi
