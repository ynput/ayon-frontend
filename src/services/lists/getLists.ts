import {
  GetListItemsQuery,
  GetListItemsQueryVariables,
  GetListsQueryVariables,
  api as gqlApi,
} from '@api/graphql'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { GetListsQuery } from '@api/graphql'

// Define the LISTS_PER_PAGE constant for pagination
export const LISTS_PER_PAGE = 100

// Define the type for our transformed lists data
type QueryEntityList = GetListsQuery['project']['entityLists']['edges'][number]['node']
export type EntityList = QueryEntityList

// Define the result type for lists query
export type GetListsResult = {
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string | null
  }
  lists: EntityList[]
}

// Define the page param type for infinite query
type ListsPageParam = {
  cursor: string
}
type QueryEntityListItemEdge =
  GetListItemsQuery['project']['entityLists']['edges'][number]['node']['items']['edges'][number]
type QueryEntityListItemNode = QueryEntityListItemEdge['node']
export type EntityListItem = NonNullable<QueryEntityListItemNode> &
  Omit<QueryEntityListItemEdge, 'node'>
// Define the result type for items query
export type GetListItemsResult = {
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string | null
  }
  items: (QueryEntityListItemNode & Omit<QueryEntityListItemEdge, 'node'>)[]
}

type ListItemsPageParam = {
  cursor: string
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetLists' | 'GetListItems'> & {
  GetLists: OverrideResultType<Definitions['GetLists'], GetListsResult>
  GetListItems: OverrideResultType<Definitions['GetListItems'], GetListItemsResult>
}

const getListsGqlApiEnhanced = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetLists: {
      transformResponse: (response: GetListsQuery): GetListsResult => {
        return {
          lists: response.project.entityLists.edges.map((edge) => edge.node),
          pageInfo: response.project.entityLists.pageInfo,
        }
      },
    },
    GetListItems: {
      transformResponse: (response: GetListItemsQuery): GetListItemsResult => {
        return {
          items: response.project.entityLists.edges.flatMap((listEdge) =>
            listEdge.node.items.edges.map(
              ({ node, ...edge }) => ({ ...node, ...edge } as GetListItemsResult['items'][number]),
            ),
          ),
          pageInfo: response.project.entityLists.edges[0].node.items.pageInfo,
        }
      },
    },
  },
})

export const getListsGqlApiInjected = getListsGqlApiEnhanced.injectEndpoints({
  endpoints: (build) => ({
    getListsInfinite: build.infiniteQuery<
      GetListsResult,
      Omit<GetListsQueryVariables, 'first' | 'after' | 'before'>,
      ListsPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '' },
        getNextPageParam: (lastPage) => {
          const { pageInfo } = lastPage
          if (!pageInfo.hasNextPage || !pageInfo.endCursor) return undefined

          return {
            cursor: pageInfo.endCursor,
          }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const { cursor } = pageParam

          // Build the query parameters for GetLists
          const queryParams = {
            ...queryArg,
            first: LISTS_PER_PAGE,
            after: cursor || undefined,
          }

          // Call the existing GetLists endpoint
          const result = await api.dispatch(
            getListsGqlApiEnhanced.endpoints.GetLists.initiate(queryParams, { forceRefetch: true }),
          )

          if (result.error) throw result.error

          return {
            data: result.data || {
              lists: [],
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
                startCursor: null,
                hasPreviousPage: false,
              },
            },
          }
        } catch (e: any) {
          console.error('Error in getListsInfinite queryFn:', e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      providesTags: (result) => [
        { type: 'entityList', id: 'LIST' },
        ...(result?.pages.flatMap((page) => page.lists) || []).map((list) => ({
          type: 'entityList' as const,
          id: list.id,
        })),
      ],
    }),
    getListItemsInfinite: build.infiniteQuery<
      GetListItemsResult,
      Omit<GetListItemsQueryVariables, 'first' | 'after' | 'before'>,
      ListItemsPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '' },
        getNextPageParam: (lastPage) => {
          const { pageInfo } = lastPage
          if (!pageInfo.hasNextPage || !pageInfo.endCursor) return undefined

          return {
            cursor: pageInfo.endCursor,
          }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const { cursor } = pageParam

          // Build the query parameters for GetLists
          const queryParams = {
            ...queryArg,
            first: LISTS_PER_PAGE,
            after: cursor || undefined,
          }

          // Call the existing GetLists endpoint
          const result = await api.dispatch(
            getListsGqlApiEnhanced.endpoints.GetListItems.initiate(queryParams, {
              forceRefetch: true,
            }),
          )

          if (result.error) throw result.error

          return {
            data: result.data || {
              items: [],
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
                startCursor: null,
                hasPreviousPage: false,
              },
            },
          }
        } catch (e: any) {
          console.error('Error in getListsInfinite queryFn:', e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      providesTags: (result, _e, { listId, projectName }) => [
        { type: 'entityListItem', id: 'LIST' },
        { type: 'entityListItem', id: listId },
        { type: 'entityListItem', id: projectName },
        ...(result?.pages.flatMap((page) => page.items) || [])
          .filter((i) => !!i)
          .flatMap((item) => [
            {
              type: 'entityListItem',
              id: item.id,
            },
            {
              type: 'entityListItem',
              id: item.entityId,
            },
          ]),
      ],
    }),
  }),
})

export default getListsGqlApiInjected

export const {
  useGetListsInfiniteInfiniteQuery,
  useGetListItemsInfiniteInfiniteQuery,
  useLazyGetListItemsQuery,
} = getListsGqlApiInjected
