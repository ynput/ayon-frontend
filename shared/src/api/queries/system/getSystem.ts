import { GetSiteInfoApiResponse, systemApi } from '@shared/api/generated'

interface GetSiteInfoResult extends GetSiteInfoApiResponse {
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
              ...(result.attributes || []).map((attr) => ({
                type: 'attribute' as const,
                id: attr.name,
              })),
            ]
          : ['info'],
    },
    listFrontendModules: {
      providesTags: ['info'],
    },
  },
})

export const { useGetSiteInfoQuery, useLazyGetSiteInfoQuery, useListFrontendModulesQuery } =
  getSystemApi
export { getSystemApi as systemQueries }
