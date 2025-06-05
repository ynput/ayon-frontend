import { GetLatestProductVersionQuery, gqlApi, versionsApi } from '@shared/api'

export type GetLatestVersionResult =
  GetLatestProductVersionQuery['project']['versions']['edges'][0]['node']

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetLatestProductVersion'> & {
  GetLatestProductVersion: OverrideResultType<
    Definitions['GetLatestProductVersion'],
    GetLatestVersionResult
  >
}

// get versions for a specific product
const enhancedGqlApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetLatestProductVersion: {
      transformResponse: (response: GetLatestProductVersionQuery) =>
        response.project.versions.edges[0]?.node,
      providesTags: (result, _e, { productId }) =>
        result
          ? [
              { type: 'version', id: result.id },
              { type: 'product', id: result.productId },
            ]
          : [{ type: 'product', id: productId }],
    },
  },
})

export const { useGetLatestProductVersionQuery } = enhancedGqlApi

// create a new version for a specific product
const uploadVersions = versionsApi.enhanceEndpoints({
  endpoints: {
    createVersion: {
      invalidatesTags: (_r, _e, { versionPostModel }) => [
        { type: 'product', id: versionPostModel.productId },
      ],
    },
    deleteVersion: {
      invalidatesTags: (_r, _e, { versionId }) => [
        { type: 'version', id: versionId },
        { type: 'product', id: versionId },
      ],
    },
  },
})

export const { useCreateVersionMutation, useDeleteVersionMutation } = uploadVersions
