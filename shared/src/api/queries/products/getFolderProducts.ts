import { GetFolderProductsQuery, gqlApi } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

export interface FolderProduct {
  id: string
  name: string
  productType: string
  latestVersion: {
    id: string
    version: number
    task: {
      id: string
      name: string
      label: string | null
      taskType: string
    } | null
  } | null
}

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
type UpdatedDefinitions = Omit<Definitions, 'GetFolderProducts'> & {
  GetFolderProducts: OverrideResultType<Definitions['GetFolderProducts'], FolderProduct[]>
}

const enhancedApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetFolderProducts: {
      transformResponse: (response: GetFolderProductsQuery): FolderProduct[] => {
        const edges = response?.project?.products?.edges || []
        return edges.map((edge) => ({
          id: edge.node.id,
          name: edge.node.name,
          productType: edge.node.productType,
          latestVersion: edge.node.latestVersion
            ? {
                id: edge.node.latestVersion.id,
                version: edge.node.latestVersion.version,
                task: edge.node.latestVersion.task
                  ? {
                      id: edge.node.latestVersion.task.id,
                      name: edge.node.latestVersion.task.name,
                      label: edge.node.latestVersion.task.label ?? null,
                      taskType: edge.node.latestVersion.task.taskType,
                    }
                  : null,
              }
            : null,
        }))
      },
      providesTags: (result, _e, { folderId }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'product' as const, id })),
              { type: 'product' as const, id: folderId },
            ]
          : [{ type: 'product' as const, id: folderId }],
    },
  },
})

export const { useGetFolderProductsQuery } = enhancedApi