import { attributesApi, AttributeModel, GetAttributeListApiResponse } from '@shared/api/generated'

type GetAttributeListResult = AttributeModel[]

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof attributesApi>
type TagTypes = TagTypesFromApi<typeof attributesApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getAttributeList'> & {
  getAttributeList: OverrideResultType<Definitions['getAttributeList'], GetAttributeListResult>
}

const enhancedApi = attributesApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getAttributeList: {
      transformResponse: (res: GetAttributeListApiResponse) => res.attributes || [],
      providesTags: (result) =>
        result
          ? [...result.map(({ name }) => ({ type: 'attribute', id: name })), 'attribute']
          : ['attribute'],
    },
    getAttributeConfig: {
      providesTags: (_r, _e, { attributeName }) => [
        { type: 'attribute', id: attributeName },
        'attribute',
      ],
    },
  },
})

export default enhancedApi

export const { useGetAttributeListQuery, useGetAttributeConfigQuery } = enhancedApi
