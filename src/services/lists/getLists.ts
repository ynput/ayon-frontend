import { GetListsQueryVariables, api as gqlApi } from '@api/graphql'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { GetListsQuery } from '@api/graphql'

// Define the LISTS_PER_PAGE constant for pagination
export const LISTS_PER_PAGE = 100

// Define the type for our transformed lists data
type QueryEntityListItem = GetListsQuery['project']['entityLists']['edges'][number]['node']
export type EntityListItem = QueryEntityListItem

// Define the result type for our query
export type GetListsResult = {
  pageInfo: {
    hasNextPage: boolean
    endCursor?: string | null
  }
  lists: EntityListItem[]
}

// Define the page param type for infinite query
type ListsPageParam = {
  cursor: string
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetLists'> & {
  GetLists: OverrideResultType<Definitions['GetLists'], GetListsResult>
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
          const { projectName, filter } = queryArg
          const { cursor } = pageParam

          // Build the query parameters for GetLists
          const queryParams = {
            projectName,
            filter,
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
  }),
})

export default getListsGqlApiInjected

export const { useGetListsInfiniteInfiniteQuery } = getListsGqlApiInjected
