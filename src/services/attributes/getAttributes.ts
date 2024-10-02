import { api, AttributeModel, GetAttributeListApiResponse } from '@api/rest/attributes'

type GetAttributeListResult = AttributeModel[]

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getAttributeList'> & {
  getAttributeList: OverrideResultType<Definitions['getAttributeList'], GetAttributeListResult>
}

export const attributesApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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

export const { useGetAttributeListQuery, useGetAttributeConfigQuery } = attributesApi
