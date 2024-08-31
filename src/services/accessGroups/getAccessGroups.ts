import { api } from '@api/rest/accessGroups'

// HACK: manually create types as they are not in the API yet
export type AccessGroup = {
  name?: string
  isProjectLevel?: boolean
}

export type getAccessGroupsResult = AccessGroup[]

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getAccessGroups'> & {
  getAccessGroups: OverrideResultType<Definitions['getAccessGroups'], getAccessGroupsResult>
}

const accessGroupsApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getAccessGroups: {
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ name }) => ({ type: 'accessGroup', id: name })),
              { type: 'accessGroup', id: 'LIST' },
            ]
          : [{ type: 'accessGroup', id: 'LIST' }],
    },
    getAccessGroup: {
      providesTags: (_result, _err, { accessGroupName }) => [
        { type: 'accessGroup', id: accessGroupName },
        { type: 'accessGroup', id: 'LIST' },
      ],
    },
    getAccessGroupSchema: {},
  },
})

export const { useGetAccessGroupsQuery, useGetAccessGroupQuery, useGetAccessGroupSchemaQuery } =
  accessGroupsApi

export default accessGroupsApi
