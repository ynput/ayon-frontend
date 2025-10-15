// QUERIES FOR THE VERSIONS PAGE, FETCHING AND UPDATING DATA
// Uses a separate graphqlVersionsApi for increased IDE speed

// There are 4 main fetch requests:

// Non-stacked:
// 1. GetVersions - fetches all versions in the project for given filtering and with pagination

// Stacked:
// 2. GetTopVersions - fetches 1 version per product, by default the latest version (top meaning the top of the stack that represents then whole version stack (product))
// 3. GetVersionsByParents - when a stack is expanded, fetches all versions for the products that are expanded. Uses getVersionsByParentId for each parent id. (uses queryFn)
// 4. GetVersionsByParentId - get all versions for a specific product. Used by getVersionsByParents only.

// VersionFragment is used in all queries to ensure consistent data structure

import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  InfiniteData,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import { GetVersionsQuery, gqlApi } from '@shared/api/generated'
import {
  provideTagsForVersionsInfinite,
  provideTagsForVersionsResult,
  transformVersionsResponse,
} from './versionsUtils'

// Query result types
export type VersionNodeRAW = GetVersionsQuery['project']['versions']['edges'][0]['node']
export type VersionNode = VersionNodeRAW & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
}
export type GetVersionsResult = {
  pageInfo: GetVersionsQuery['project']['versions']['pageInfo']
  versions: VersionNode[]
}

// for infinite query args
export type GetVersionsArgs = {
  projectName: string
  filter?: string
  search?: string
  productIds?: string[]
  desc?: boolean
  sortBy?: string
}

// for paginated queries in infinite query
type VersionsPageParam = {
  cursor: string
  desc?: boolean
}

export type VersionInfiniteResult = InfiniteData<GetVersionsResult, VersionsPageParam> | undefined

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetVersions'> & {
  GetVersions: OverrideResultType<Definitions['GetVersions'], GetVersionsResult>
}

const enhancedVersionsPageApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetVersions: {
      transformResponse: transformVersionsResponse,
      providesTags: provideTagsForVersionsResult,
    },
  },
})

export const VERSIONS_INFINITE_QUERY_COUNT = 100 // Number of items to fetch per page

const injectedVersionsPageApi = enhancedVersionsPageApi.injectEndpoints({
  endpoints: (build) => ({
    // enhance GetVersions with an infinite query (main query used)
    getVersionsInfinite: build.infiniteQuery<GetVersionsResult, GetVersionsArgs, VersionsPageParam>(
      {
        infiniteQueryOptions: {
          initialPageParam: { cursor: '', desc: false },
          // Calculate the next page param based on current page response and params
          getNextPageParam: (lastPage, _allPages, lastPageParam, _allPageParams) => {
            // Use the endCursor from the query as the next page param
            const pageInfo = lastPage.pageInfo
            const desc = lastPageParam.desc
            const hasNextPage = desc ? pageInfo.hasPreviousPage : pageInfo.hasNextPage

            if (!hasNextPage || !pageInfo.endCursor) return undefined

            return {
              cursor: pageInfo.endCursor,
              desc: lastPageParam.desc,
            }
          },
        },
        queryFn: async ({ queryArg, pageParam }, api) => {
          try {
            const { projectName, filter, search, productIds, sortBy, desc } = queryArg
            const { cursor } = pageParam

            // Build the query parameters for GetVersions query
            const queryParams: any = {
              projectName,
              filter,
              search,
              productIds,
            }

            // Add cursor-based pagination
            if (sortBy) {
              queryParams.sortBy = sortBy
              if (desc) {
                queryParams.before = cursor || undefined
                queryParams.last = VERSIONS_INFINITE_QUERY_COUNT
              } else {
                queryParams.after = cursor || undefined
                queryParams.first = VERSIONS_INFINITE_QUERY_COUNT
              }
            } else {
              queryParams.after = cursor || undefined
              queryParams.first = VERSIONS_INFINITE_QUERY_COUNT
            }

            // Call the existing GetVersions gql query
            const result = await api.dispatch(
              enhancedVersionsPageApi.endpoints.GetVersions.initiate(queryParams, {
                forceRefetch: true,
              }),
            )

            if (result.error) throw result.error
            const fallback = {
              versions: [],
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
                startCursor: null,
                hasPreviousPage: false,
              },
            }

            // Return the versions directly as required by the infinite query format
            return {
              data: result.data || fallback,
            }
          } catch (e: any) {
            console.error('Error in getVersionsInfiniteQuery queryFn:', e)
            return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
          }
        },
        providesTags: provideTagsForVersionsInfinite,
      },
    ),
  }),
})

// export gql endpoints
export const { useGetVersionsQuery } = enhancedVersionsPageApi
// export custom queries
export const { useGetVersionsInfiniteInfiniteQuery: useGetVersionsInfiniteQuery } =
  injectedVersionsPageApi
