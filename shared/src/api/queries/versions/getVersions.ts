// QUERIES FOR THE VERSIONS PAGE, FETCHING AND UPDATING DATA
// Uses a separate graphqlVersionsApi for increased IDE speed

// There are 4 main fetch requests:

// Non-stacked:
// 1. GetVersions - fetches all versions in the project for given filtering and with pagination

// Stacked:
// 2. GetTopVersions - fetches 1 version per product, by default the latest version (top meaning the top of the stack that represents then whole version stack (product))
// 3. GetVersionsByProducts - when a stack is expanded, fetches all versions for the products that are expanded. Uses getVersionsByProductId for each parent id. (uses queryFn)
// 4. GetVersionsByProductId - get all versions for a specific product. Used by getVersionsByProducts only.

// VersionFragment is used in all queries to ensure consistent data structure

import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  InfiniteData,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import {
  GetVersionsByProductIdQueryVariables,
  GetVersionsQuery,
  GetVersionsQueryVariables,
  gqlApi,
} from '@shared/api/generated'
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
  pageInfo?: GetVersionsQuery['project']['versions']['pageInfo']
  versions: VersionNode[]
}

// for infinite query args
export type GetVersionsArgs = Omit<GetVersionsQueryVariables, 'cursor'> & {
  desc?: boolean // sort direction
}

// for paginated queries in infinite query
type VersionsPageParam = {
  cursor: string
  desc?: boolean
}

type GetVersionsByProductsArgs = {
  projectName: string
  productIds: string[] // array of parent ids (product ids)
  sortBy?: string
  desc?: boolean
}

export type VersionInfiniteResult = InfiniteData<GetVersionsResult, VersionsPageParam> | undefined

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetVersions'> & {
  GetVersions: OverrideResultType<Definitions['GetVersions'], GetVersionsResult>
  GetVersionsByProductId: OverrideResultType<Definitions['GetVersions'], GetVersionsResult>
}

const enhancedVersionsPageApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    // used by both stacked and non-stacked views
    GetVersions: {
      transformResponse: transformVersionsResponse,
      providesTags: provideTagsForVersionsResult,
    },
    // used by getVersionsByProducts only
    GetVersionsByProductId: {
      transformResponse: transformVersionsResponse,
      providesTags: provideTagsForVersionsResult,
    },
  },
})

const VERSIONS_INFINITE_QUERY_COUNT = 100 // Number of items to fetch per page
const VERSIONS_BY_PRODUCT_ID_QUERY_COUNT = 1000 // max number of versions to fetch per product id
const MAX_PAGES_PER_PRODUCT = 10 // Hard cutoff to prevent infinite loops

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
            const hasNextPage = desc ? pageInfo?.hasPreviousPage : pageInfo?.hasNextPage

            if (!hasNextPage || !pageInfo?.endCursor) return undefined

            return {
              cursor: pageInfo?.endCursor,
              desc: lastPageParam.desc,
            }
          },
        },
        queryFn: async ({ queryArg, pageParam }, api) => {
          try {
            const { projectName, filter, search, productIds, sortBy, desc, latest } = queryArg
            const { cursor } = pageParam

            // Build the query parameters for GetVersions query
            const queryParams: any = {
              projectName,
              filter,
              search,
              productIds,
              latest,
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

    // custom query function that fetches versions by multiple parent ids -not infinite and gets 1000 versions max
    getVersionsByProducts: build.query<GetVersionsResult, GetVersionsByProductsArgs>({
      queryFn: async (args, { dispatch }) => {
        const { productIds = [], desc, ...argsRest } = args

        // Helper function to fetch a page of versions
        const fetchVersionsPage = async (productId: string, cursor?: string) => {
          const queryParams: GetVersionsByProductIdQueryVariables = {
            ...argsRest,
            productIds: [productId],
          }

          if (desc) {
            if (cursor) queryParams.before = cursor
            queryParams.last = VERSIONS_BY_PRODUCT_ID_QUERY_COUNT
          } else {
            if (cursor) queryParams.after = cursor
            queryParams.first = VERSIONS_BY_PRODUCT_ID_QUERY_COUNT
          }

          return dispatch(
            enhancedVersionsPageApi.endpoints.GetVersionsByProductId.initiate(queryParams, {
              forceRefetch: true,
            }),
          )
        }

        try {
          // for each product id, call getVersionsByProductId
          const promises = productIds?.map((productId) => fetchVersionsPage(productId))

          const results = await Promise.all(promises)

          // Collect all versions from initial queries
          const allVersions: VersionNode[] = []

          // Check each result for additional pages and fetch them if needed
          for (let i = 0; i < results.length; i++) {
            const result = results[i]
            const productId = productIds[i]

            if (result.error) {
              console.error('Error fetching versions by product:', result.error)
              continue
            }

            if (!result.data) continue

            // Add initial page versions
            allVersions.push(...result.data.versions)

            // Check if there are more pages to fetch
            let pageInfo = result.data.pageInfo
            let pageCount = 1

            while (pageInfo && pageCount < MAX_PAGES_PER_PRODUCT) {
              const hasNextPage = desc ? pageInfo.hasPreviousPage : pageInfo.hasNextPage
              const cursor = pageInfo.endCursor

              if (!hasNextPage || !cursor) break

              // Fetch next page
              const nextPageResult = await fetchVersionsPage(productId, cursor)

              if (nextPageResult.error || !nextPageResult.data) break

              allVersions.push(...nextPageResult.data.versions)
              pageInfo = nextPageResult.data.pageInfo
              pageCount++
            }
          }

          return {
            data: {
              versions: allVersions,
              pageInfo: undefined, // pageInfo is undefined as we've flattened multiple queries
            },
          }
        } catch (error: any) {
          console.error('Error in getVersionsByProducts queryFn:', error)
          return { error: { status: 'FETCH_ERROR', error: error.message } as FetchBaseQueryError }
        }
      },
      providesTags: provideTagsForVersionsResult,
    }),
  }),
})

// export gql endpoints
export const { useGetVersionsQuery } = enhancedVersionsPageApi
// export custom queries
export const {
  useGetVersionsInfiniteInfiniteQuery: useGetVersionsInfiniteQuery,
  useGetVersionsByProductsQuery,
} = injectedVersionsPageApi
