// QUERIES FOR THE VERSIONS PAGE, FETCHING AND UPDATING DATA
// Uses a separate graphqlVersionsApi for increased IDE speed

// There are 4 main fetch requests:

// Versions Only:
// 1. GetVersions - fetches all versions in the project for given filtering and with pagination

// Products and Versions (stacked):
// 2. GetProducts - fetches all products in the project based on product and version filtering
// 3. GetVersionsByProducts - when a product is expanded, fetches all versions for the products that are expanded. Uses getVersionsByProductId for each parent id. (uses queryFn)
// 4. GetVersionsByProductId - get all versions for a specific product. Used by getVersionsByProducts only.

// VersionFragment is used in all version queries to ensure consistent data structure

import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  InfiniteData,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import {
  FolderAttribFragment,
  GetProductsQuery,
  GetProductsQueryVariables,
  GetVersionsByProductIdQueryVariables,
  GetVersionsQuery,
  GetVersionsQueryVariables,
  gqlApi,
  PageInfo,
} from '@shared/api/generated'
import {
  parseErrorMessage,
  provideTagsForProductsInfinite,
  provideTagsForProductsResult,
  provideTagsForVersionsInfinite,
  provideTagsForVersionsResult,
  transformProductsResponse,
  transformVersionsResponse,
} from './versionsUtils'
import { toast } from 'react-toastify'

// Query result types
export type FolderAttribNode = FolderAttribFragment & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
}
export type VersionNodeRAW = GetVersionsQuery['project']['versions']['edges'][0]['node']
export type VersionNode = VersionNodeRAW & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
  product: VersionNodeRAW['product'] & {
    attrib: Record<string, any> // parsed from allAttrib JSON string
    folder: FolderAttribNode // folder with parsed attribs
  }
}
export type ProductNodeRAW = GetProductsQuery['project']['products']['edges'][0]['node']
export type ProductNode = ProductNodeRAW & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
  featuredVersion?: VersionNode | null // added separately
  folder: FolderAttribNode // folder with parsed attribs
}

export type GetVersionsResult = {
  pageInfo?: PageInfo
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

export type GetProductsArgs = Omit<GetProductsQueryVariables, 'cursor' | 'versionIds'> & {
  desc?: boolean // sort direction
}

type ProductsPageParam = {
  cursor: string
  desc?: boolean
}

type GetVersionsByProductsArgs = GetVersionsByProductIdQueryVariables & {
  productIds: string[]
  desc?: boolean
}

export type VersionInfiniteResult = InfiniteData<GetVersionsResult, VersionsPageParam> | undefined

export type ProductInfiniteResult = InfiniteData<GetProductsResult, ProductsPageParam> | undefined

export type GetProductsResult = {
  pageInfo: PageInfo
  products: ProductNode[]
}

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetVersions'> & {
  GetVersions: OverrideResultType<Definitions['GetVersions'], GetVersionsResult>
  GetVersionsByProductId: OverrideResultType<Definitions['GetVersions'], GetVersionsResult>
  GetProducts: OverrideResultType<Definitions['GetProducts'], GetProductsResult>
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
    // used by getProductsInfinite only
    GetProducts: {
      transformResponse: transformProductsResponse,
      providesTags: provideTagsForProductsResult,
    },
  },
})

const INFINITE_QUERY_COUNT = 100 // Number of items to fetch per page
const VERSIONS_BY_PRODUCT_ID_QUERY_COUNT = 1000 // max number of versions to fetch per product id
const MAX_PAGES_PER_PRODUCT = 10 // Hard cutoff to prevent infinite loops

const injectedVersionsPageApi = enhancedVersionsPageApi.injectEndpoints({
  endpoints: (build) => ({
    // enhance GetVersions with an infinite query
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
            const { sortBy, desc, folderIds, ...rest } = queryArg
            const { cursor } = pageParam

            // Build the query parameters for GetVersions query
            const queryParams: any = {
              ...rest,
            }

            // Add cursor-based pagination
            if (sortBy) {
              queryParams.sortBy = sortBy
              if (desc) {
                queryParams.before = cursor || undefined
                queryParams.last = INFINITE_QUERY_COUNT
              } else {
                queryParams.after = cursor || undefined
                queryParams.first = INFINITE_QUERY_COUNT
              }
            } else {
              queryParams.after = cursor || undefined
              queryParams.first = INFINITE_QUERY_COUNT
            }

            // if folderIds have a length, add them to the query params
            if (folderIds && folderIds.length) {
              queryParams.folderIds = folderIds
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
            toast.error('Error fetching versions.')
            return {
              error: {
                status: 'FETCH_ERROR',
                error: parseErrorMessage(e.message),
              } as FetchBaseQueryError,
            }
          }
        },
        providesTags: provideTagsForVersionsInfinite,
      },
    ),

    // custom query function that fetches versions by multiple parent ids -not infinite and gets 1000 versions max
    getVersionsByProducts: build.query<GetVersionsResult, GetVersionsByProductsArgs>({
      queryFn: async (args, { dispatch }) => {
        const { productIds = [], desc, ...rest } = args

        // Helper function to fetch a page of versions
        const fetchVersionsPage = async (productId: string, cursor?: string) => {
          const queryParams: GetVersionsByProductIdQueryVariables = {
            ...rest,
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
          const promises = productIds.map((productId) => fetchVersionsPage(productId))

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
        } catch (e: any) {
          console.error('Error in getVersionsByProducts queryFn:', e)
          toast.error('Error fetching versions for products.')
          return {
            error: {
              status: 'FETCH_ERROR',
              error: parseErrorMessage(e.message),
            } as FetchBaseQueryError,
          }
        }
      },
      providesTags: provideTagsForVersionsResult,
    }),

    // enhance GetProducts with an infinite query
    getProductsInfinite: build.infiniteQuery<GetProductsResult, GetProductsArgs, ProductsPageParam>(
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
          let result
          try {
            const { sortBy, desc, folderIds, ...rest } = queryArg
            const { cursor } = pageParam

            // Build the query parameters for GetProducts query
            const queryParams: any = {
              ...rest,
            }

            // Add cursor-based pagination
            if (sortBy) {
              queryParams.sortBy = sortBy
              if (desc) {
                queryParams.before = cursor || undefined
                queryParams.last = INFINITE_QUERY_COUNT
              } else {
                queryParams.after = cursor || undefined
                queryParams.first = INFINITE_QUERY_COUNT
              }
            } else {
              queryParams.after = cursor || undefined
              queryParams.first = INFINITE_QUERY_COUNT
            }

            // if folderIds have a length, add them to the query params
            if (folderIds && folderIds.length) {
              queryParams.folderIds = folderIds
            }

            // Call the existing GetProducts gql query
            result = await api.dispatch(
              enhancedVersionsPageApi.endpoints.GetProducts.initiate(queryParams, {
                forceRefetch: true,
              }),
            )

            if (result.error) throw result.error
            const fallback = {
              products: [],
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
                startCursor: null,
                hasPreviousPage: false,
              },
            }

            // Return the products directly as required by the infinite query format
            return {
              data: result.data || fallback,
            }
          } catch (e: any) {
            console.error('Error in getProductsInfiniteQuery queryFn:', e)
            toast.error('Error fetching products.')
            return {
              error: {
                status: 'FETCH_ERROR',
                error: parseErrorMessage(e.message),
              } as FetchBaseQueryError,
            }
          }
        },
        providesTags: provideTagsForProductsInfinite,
      },
    ),
  }),
})

// export gql endpoints
export const { useGetVersionsQuery } = enhancedVersionsPageApi
// export custom queries
export const {
  useGetVersionsInfiniteInfiniteQuery: useGetVersionsInfiniteQuery,
  useGetVersionsByProductsQuery,
  useGetProductsInfiniteInfiniteQuery: useGetProductsInfiniteQuery,
} = injectedVersionsPageApi
