import { accessApi, GetShareOptionsApiResponse } from '@shared/api/generated'

const getBaseTags = (projectName?: string) => {
  const tags = [{ type: 'shared', id: 'LIST' }]
  if (projectName) {
    tags.push({
      type: 'shared',
      id: projectName.toUpperCase(),
    })
  }
  return tags
}

const getShareOptionsTags = (options: getShareOptionsResult) => {
  const tags = []

  for (const option of options) {
    const sharedTag = { type: 'shared' as const, id: option.value }
    tags.push(sharedTag)

    let type: string | null
    switch (option.shareType) {
      case 'user':
        type = 'user'
        break
      case 'group':
        type = 'accessGroup'
        break
      case 'team':
        type = 'team'
        break
      default:
        type = null
        break
    }

    if (type) {
      const typeTag = { type: type, id: option.name } as const
      console.log(typeTag)
      tags.push(typeTag)
    }
  }

  return tags
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

export type getShareOptionsResult = GetShareOptionsApiResponse['options']

type Definitions = DefinitionsFromApi<typeof accessApi>
type TagTypes = TagTypesFromApi<typeof accessApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getShareOptions'> & {
  getShareOptions: OverrideResultType<Definitions['getShareOptions'], getShareOptionsResult>
}

const shareApi = accessApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getShareOptions: {
      transformErrorResponse: (error: any) => error.data?.detail,
      transformResponse: (response: GetShareOptionsApiResponse) => response?.options || [],
      providesTags: (result, _e, { projectName }) =>
        result
          ? [...getShareOptionsTags(result), ...getBaseTags(projectName)]
          : getBaseTags(projectName),
    },
  },
})

export const { useGetShareOptionsQuery } = shareApi
export { shareApi as shareQueries }
