import { systemApi } from '@shared/api/generated'
import type { GetSiteInfoApiResponse } from '@shared/api/generated'
import { PubSub } from '@shared/util'

export interface GetSiteInfoResult extends GetSiteInfoApiResponse {
  uiExposureLevel: number
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof systemApi>
type TagTypes = TagTypesFromApi<typeof systemApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getSiteInfo'> & {
  getSiteInfo: OverrideResultType<Definitions['getSiteInfo'], GetSiteInfoResult>
}

const getSystemApi = systemApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getSiteInfo: {
      providesTags: (result) =>
        result
          ? [
              'info',
              // setAttributeList invalidates the id-less tag, so provide it too
              'attribute',
              ...(result.attributes || []).map((attr) => ({
                type: 'attribute' as const,
                id: attr.name,
              })),
            ]
          : ['info', 'attribute'],
    },
    listFrontendModules: {
      providesTags: ['info', 'frontendModules'],
      // production addon versions can change without a server restart (bundle edits),
      // so refetch on bundle events to pick up the new versions
      async onCacheEntryAdded(_, { dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        let token
        try {
          await cacheDataLoaded

          token = PubSub.subscribe('bundle', () => {
            dispatch(getSystemApi.util.invalidateTags(['frontendModules']))
          })
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`
        }
        await cacheEntryRemoved
        PubSub.unsubscribe(token)
      },
    },
  },
})

export const { useGetSiteInfoQuery, useLazyGetSiteInfoQuery, useListFrontendModulesQuery } =
  getSystemApi
export { getSystemApi as systemQueries }
