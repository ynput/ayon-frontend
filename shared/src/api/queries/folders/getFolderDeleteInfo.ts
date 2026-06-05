import { GetFolderDeleteInfoQuery, gqlApi } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

export type FolderDeleteInfo = {
  id: string
  name: string
  label?: string | null
  totalFolderCount: number
  totalTaskCount: number
  totalProductCount: number
  totalVersionCount: number
}

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
type UpdatedDefinitions = Omit<Definitions, 'GetFolderDeleteInfo'> & {
  GetFolderDeleteInfo: OverrideResultType<Definitions['GetFolderDeleteInfo'], FolderDeleteInfo[]>
}

const enhancedApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetFolderDeleteInfo: {
      transformResponse: (response: GetFolderDeleteInfoQuery): FolderDeleteInfo[] => {
        const edges = response?.project?.folders?.edges || []
        return edges.map((edge) => ({
          id: edge.node.id,
          name: edge.node.name,
          label: edge.node.label ?? null,
          totalFolderCount: edge.node.totalFolderCount ?? 0,
          totalTaskCount: edge.node.totalTaskCount ?? 0,
          totalProductCount: edge.node.totalProductCount ?? 0,
          totalVersionCount: edge.node.totalVersionCount ?? 0,
        }))
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'folder' as const, id })),
              { type: 'folder' as const, id: 'DELETE_INFO' },
            ]
          : [{ type: 'folder' as const, id: 'DELETE_INFO' }],
    },
  },
})

export const { useGetFolderDeleteInfoQuery, useLazyGetFolderDeleteInfoQuery } = enhancedApi
