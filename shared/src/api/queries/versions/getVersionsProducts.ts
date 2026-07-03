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
  GetProductsQuery,
  GetProductsQueryVariables,
  GetProductsColumnStatsQuery,
  GetVersionsByProductIdQueryVariables,
  GetVersionsColumnStatsQuery,
  GetVersionsQuery,
  GetVersionsQueryVariables,
  gqlApi,
  PageInfo,
  VpFolderFragment,
} from '@shared/api/generated'
import {
  parseGQLErrorMessage,
  provideTagsForProductsInfinite,
  provideTagsForProductsResult,
  provideTagsForVersionsInfinite,
  provideTagsForVersionsResult,
  transformProductsResponse,
  transformVersionsResponse,
} from './getVersionsProductsUtils'
import { parseAllAttribs } from '../overview'
import { PubSub, subscribeToThumbnailUpdates, ThumbnailUpdateMessage } from '@shared/util'
import type { FieldStats } from '../columnStats'
import {
  normalizeFieldStats,
  mergeFieldStats,
  hasNewTargetFields,
  transformStatsError,
} from '../columnStats'

// SHARED CACHE UPDATE HELPERS
// These helpers are used by PubSub handlers to update cached data in real-time

/**
 * Finds the correct insertion index for a new item in a sorted array
 * Used when adding new items to maintain sort order
 */
function findSortedInsertIndex<T>(items: T[], newItem: T, sortBy: keyof T, desc: boolean): number {
  for (let i = 0; i < items.length; i++) {
    const newValue = newItem[sortBy]
    const currentValue = items[i][sortBy]
    const shouldInsert = desc ? newValue > currentValue : newValue < currentValue

    if (shouldInsert) {
      return i
    }
  }
  return items.length
}

/**
 * Updates a paginated cache (draft.pages[].items[]) with a new/updated/deleted item
 * Handles: update existing, delete if not in response, add at sorted position
 *
 * @param pages - Array of page objects containing items arrays
 * @param entityId - ID of the entity to update/delete/add
 * @param updatedItem - The updated item, or undefined if deleted
 * @param itemsKey - Key to access items array in each page ('versions' or 'products')
 * @param sortBy - Property to sort by when inserting new items
 * @param desc - Sort direction (true = descending)
 */
function updatePagedCache<T extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pages: any[],
  entityId: string,
  updatedItem: T | undefined,
  itemsKey: string,
  sortBy: keyof T,
  desc: boolean,
): void {
  // Search for existing item in all pages
  for (const page of pages) {
    const items = page[itemsKey] as T[]
    const index = items.findIndex((item) => item.id === entityId)

    if (index !== -1) {
      if (updatedItem) {
        // Update existing item
        items[index] = updatedItem
      } else {
        // Item no longer exists or doesn't match filters - remove it
        items.splice(index, 1)
      }
      return
    }
  }

  // Item not found in cache - add at correct sorted position in first page
  if (updatedItem && pages.length > 0) {
    const items = pages[0][itemsKey] as T[]
    const insertIndex = findSortedInsertIndex(items, updatedItem, sortBy, desc)
    items.splice(insertIndex, 0, updatedItem)
  }
}

/**
 * Updates a flat cache (draft.items[]) with a new/updated/deleted item
 * Handles: update existing, delete if not in response, add new
 */
function updateFlatCache<T extends { id: string }>(
  items: T[],
  entityId: string,
  updatedItem: T | undefined,
): { index: number; action: 'updated' | 'deleted' | 'added' | 'none' } {
  const index = items.findIndex((item) => item.id === entityId)

  if (index !== -1) {
    if (updatedItem) {
      items[index] = updatedItem
      return { index, action: 'updated' }
    } else {
      items.splice(index, 1)
      return { index, action: 'deleted' }
    }
  } else if (updatedItem) {
    items.push(updatedItem)
    return { index: items.length - 1, action: 'added' }
  }

  return { index: -1, action: 'none' }
}

// Query result types
export type FolderAttribNode = VpFolderFragment & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
}
export type VersionNodeRAW = GetVersionsQuery['project']['versions']['edges'][0]['node']
export type VersionNode = VersionNodeRAW & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
  product: VersionNodeRAW['product'] & {
    attrib: Record<string, any> // parsed from allAttrib JSON string
    folder: FolderAttribNode // folder with parsed attribs
  }
  groups?: { value?: string; hasNextPage?: string }[] // grouping metadata
}
export type ProductNodeRAW = GetProductsQuery['project']['products']['edges'][0]['node']
export type ProductNode = Omit<ProductNodeRAW, 'versions'> & {
  attrib: Record<string, any> // parsed from allAttrib JSON string
  featuredVersion?: VersionNode | null // added separately
  folder: FolderAttribNode // folder with parsed attribs
  versions: {
    id: string
    name: string
    version: number
    heroVersionId?: string | null
  }[] // versions with isHero flag
}

export type GetVersionsResult = {
  pageInfo?: PageInfo
  versions: VersionNode[]
  errors?: Array<{ productId: string; error: string }>
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

export type GetGroupedVersionsListArgs = {
  projectName: string
  groups: { filter: string; count?: number | null; value: string }[]
  groupFilterKey?: string
  versionFilter?: string
  productFilter?: string
  taskFilter?: string
  folderIds?: string[]
  desc?: boolean
  sortBy?: string
  featuredOnly?: string[]
  hasReviewables?: boolean
}

export type GetGroupedVersionsListResult = {
  versions: VersionNode[]
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
  GetProductsColumnStats: OverrideResultType<Definitions['GetProductsColumnStats'], FieldStats[]>
  GetVersionsColumnStats: OverrideResultType<Definitions['GetVersionsColumnStats'], FieldStats[]>
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
    // footer stats: `targets` excluded from cache key + responses merged,
    // so column toggles reuse cache and only added targets refetch
    GetProductsColumnStats: {
      transformResponse: (res: GetProductsColumnStatsQuery) =>
        normalizeFieldStats(res?.project?.products?.fieldStats ?? []),
      transformErrorResponse: (error: any) => transformStatsError(error, 'product'),
      serializeQueryArgs: ({ queryArgs: { targets: _t, ...rest } }) => rest,
      merge: (cache, incoming) => mergeFieldStats(incoming, cache),
      forceRefetch: ({ currentArg, previousArg }) => hasNewTargetFields(currentArg, previousArg),
      providesTags: (_r, _e, { projectName }) => [{ type: 'productColumnStats', id: projectName }],
    },
    GetVersionsColumnStats: {
      transformResponse: (res: GetVersionsColumnStatsQuery) =>
        normalizeFieldStats(res?.project?.versions?.fieldStats ?? []),
      transformErrorResponse: (error: any) => transformStatsError(error, 'version'),
      serializeQueryArgs: ({ queryArgs: { targets: _t, ...rest } }) => rest,
      merge: (cache, incoming) => mergeFieldStats(incoming, cache),
      forceRefetch: ({ currentArg, previousArg }) => hasNewTargetFields(currentArg, previousArg),
      providesTags: (_r, _e, { projectName }) => [{ type: 'versionColumnStats', id: projectName }],
    },
  },
})

export const VP_INFINITE_QUERY_COUNT = 250 // Number of items to fetch per page
const VERSIONS_BY_PRODUCT_ID_QUERY_COUNT = 1000 // max number of versions to fetch per product id
const MAX_PAGES_PER_PRODUCT = 10 // Hard cutoff to prevent infinite loops

const VERSION_UPDATE_BATCH_DEBOUNCE = 5000 // ms to wait before processing batched updates
const VERSION_UPDATE_ATTRIB_JITTER = 1000 // max ms of random jitter for attribute fetches
const VERSION_UPDATE_NEW_DATA_DEBOUNCE = 30000 // ms to wait before fetching new version data in batch
const VERSION_UPDATE_NEW_DATA_JITTER = 1500 // max ms of random jitter for new version data fetches

/**
 * Reusable handler for websocket version updates to perform efficient batched cache updates
 */
function createVersionUpdateBatcher(
  projectName: string,
  dispatch: any,
  handlers: {
    checkVersionInCache: (entityId: string, parentId?: string) => boolean
    onBatchUpdate: (changes: {
      deleted?: { entityId: string; parentId?: string }[]
      patched?: { entityId: string; field: string; value: any; parentId?: string }[]
      attribPatched?: { entityId: string; allAttrib: string; parsedAttrib: any }[]
      fullUpdated?: VersionNode[]
    }) => void
    getBaseFilters?: () => any
  },
) {
  let pendingPatchUpdates: { topic: string; message: any }[] = []
  let patchTimeoutId: ReturnType<typeof setTimeout> | null = null

  let pendingFullFetchIds = new Set<string>()
  let fullFetchTimeoutId: ReturnType<typeof setTimeout> | null = null

  const processPatches = async () => {
    const updates = [...pendingPatchUpdates]
    pendingPatchUpdates = []
    patchTimeoutId = null

    const deleted: { entityId: string; parentId?: string }[] = []
    const patched: { entityId: string; field: string; value: any; parentId?: string }[] = []
    const attribsToFetch = new Set<string>()

    for (const { topic, message: msg } of updates) {
      const entityId = msg.summary?.entityId
      const parentId = msg.summary?.parentId
      if (!entityId) continue

      if (topic === 'entity.version.deleted') {
        deleted.push({ entityId, parentId })
      } else if (topic.startsWith('entity.version.') && topic.endsWith('_changed')) {
        const versionFound = handlers.checkVersionInCache(entityId, parentId)
        if (!versionFound) continue

        const field = topic.split('.')[2].split('_changed')[0]

        if (field === 'attrib') {
          attribsToFetch.add(entityId)
          continue
        }

        const supportedFields = ['status', 'tags'] as const
        const isFieldSupported = supportedFields.includes(field as any)
        const value = msg.summary?.value

        if (!value || !isFieldSupported) {
          pendingFullFetchIds.add(entityId)
          continue
        }

        let castValue: any = value
        if (field === 'status') {
          castValue = String(value)
        } else if (field === 'tags') {
          castValue = Array.isArray(value) ? (value as string[]) : []
        }

        patched.push({ entityId, field, value: castValue, parentId })
      }
    }

    // Trigger full fetch if any unsupported changes were moved there
    if (pendingFullFetchIds.size > 0 && !fullFetchTimeoutId) {
      fullFetchTimeoutId = setTimeout(processFullFetches, VERSION_UPDATE_NEW_DATA_DEBOUNCE)
    }

    const attribPatched: { entityId: string; allAttrib: string; parsedAttrib: any }[] = []
    if (attribsToFetch.size > 0 && dispatch) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * VERSION_UPDATE_ATTRIB_JITTER),
        )

        const versionIds = Array.from(attribsToFetch)
        const result = await dispatch(
          enhancedVersionsPageApi.endpoints.GetVersionsAttribs.initiate(
            { projectName, versionIds },
            { forceRefetch: true },
          ),
        )

        if (result.data?.project?.versions?.edges) {
          for (const edge of result.data.project.versions.edges) {
            const node = edge.node
            if (node) {
              attribPatched.push({
                entityId: node.id,
                allAttrib: node.allAttrib,
                parsedAttrib: parseAllAttribs(node.allAttrib),
              })
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch patched version attribs', e)
      }
    }

    if (deleted.length > 0 || patched.length > 0 || attribPatched.length > 0) {
      handlers.onBatchUpdate({ deleted, patched, attribPatched })
    }
  }

  const processFullFetches = async () => {
    const versionIds = Array.from(pendingFullFetchIds)
    pendingFullFetchIds.clear()
    fullFetchTimeoutId = null

    if (versionIds.length === 0 || !dispatch) return

    try {
      // Jitter fetch to prevent thundering herd
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * VERSION_UPDATE_NEW_DATA_JITTER),
      )

      const baseFilters = handlers.getBaseFilters?.() || {}
      const result = await dispatch(
        enhancedVersionsPageApi.endpoints.GetVersions.initiate({
          ...baseFilters,
          projectName,
          versionIds,
        }),
      )

      if (result.data?.versions) {
        handlers.onBatchUpdate({ fullUpdated: result.data.versions })
      }
    } catch (e) {
      console.error('Failed to fetch full version data batch', e)
    }
  }

  return (topic: string, message: any) => {
    const project = message.project
    if (project !== projectName) return

    const entityId = message.summary?.entityId
    if (!entityId) return

    if (topic === 'entity.version.created') {
      pendingFullFetchIds.add(entityId)
      if (!fullFetchTimeoutId) {
        fullFetchTimeoutId = setTimeout(processFullFetches, VERSION_UPDATE_NEW_DATA_DEBOUNCE)
      }
    } else {
      pendingPatchUpdates.push({ topic, message })
      if (patchTimeoutId) clearTimeout(patchTimeoutId)
      patchTimeoutId = setTimeout(processPatches, VERSION_UPDATE_BATCH_DEBOUNCE)
    }
  }
}

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
                queryParams.last = VP_INFINITE_QUERY_COUNT
              } else {
                queryParams.after = cursor || undefined
                queryParams.first = VP_INFINITE_QUERY_COUNT
              }
            } else {
              queryParams.after = cursor || undefined
              queryParams.first = VP_INFINITE_QUERY_COUNT
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
            return {
              error: {
                status: 'FETCH_ERROR',
                error: parseGQLErrorMessage(e.message),
              } as FetchBaseQueryError,
            }
          }
        },
        providesTags: provideTagsForVersionsInfinite,
        keepUnusedDataFor: 30,
        // Subscribes to version entity changes and updates cache accordingly
        // Handles: create, update, delete operations
        onCacheEntryAdded: async (
          arg,
          { getCacheEntry, updateCachedData, cacheEntryRemoved, dispatch },
        ) => {
          let unsubscribeThumbnails: (() => void) | undefined

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              const relevantMessages = messages.filter((m) => m.project === arg.projectName)
              if (!relevantMessages.length) return

              updateCachedData((draft) => {
                relevantMessages.forEach((message) => {
                  if (message.summary.entityType === 'version') {
                    draft.pages.forEach((page) => {
                      const vIndex = page.versions.findIndex(
                        (v) => v.id === message.summary.entityId,
                      )
                      if (vIndex !== -1) {
                        page.versions[vIndex].thumbnailHash = message.summary.thumbnailHash || ''
                      }
                    })
                  }
                })
              })
            },
            ['version'],
          )

          const token = PubSub.subscribe(
            'entity.version',
            createVersionUpdateBatcher(arg.projectName, dispatch, {
              getBaseFilters: () => ({
                versionFilter: arg.versionFilter,
                productFilter: arg.productFilter,
                taskFilter: arg.taskFilter,
                folderIds: arg.folderIds?.length ? arg.folderIds : undefined,
                featuredOnly: arg.featuredOnly,
                hasReviewables: arg.hasReviewables,
                sortBy: arg.sortBy,
              }),
              checkVersionInCache: (entityId) => {
                const cacheVersions = getCacheEntry().data
                if (!cacheVersions) return false
                for (const page of cacheVersions.pages || []) {
                  if (page.versions.some((v) => v.id === entityId)) return true
                }
                return false
              },
              onBatchUpdate: ({ deleted, patched, attribPatched, fullUpdated }) => {
                updateCachedData((draft) => {
                  for (const page of draft?.pages || []) {
                    // Handle deletes
                    if (deleted) {
                      for (const { entityId } of deleted) {
                        const vIndex = page.versions.findIndex((v) => v.id === entityId)
                        if (vIndex !== -1) page.versions.splice(vIndex, 1)
                      }
                    }
                    // Handle simple patches
                    if (patched) {
                      for (const { entityId, field, value } of patched) {
                        const version = page.versions.find((v) => v.id === entityId)
                        if (version) {
                          // @ts-expect-error valid field
                          version[field] = value
                        }
                      }
                    }
                    // Handle attrib patched
                    if (attribPatched) {
                      for (const { entityId, allAttrib, parsedAttrib } of attribPatched) {
                        const version = page.versions.find((v) => v.id === entityId)
                        if (version) {
                          version.allAttrib = allAttrib
                          version.attrib = parsedAttrib
                        }
                      }
                    }
                    // Handle full updates
                    if (fullUpdated) {
                      for (const updatedNode of fullUpdated) {
                        const vIndex = page.versions.findIndex((v) => v.id === updatedNode.id)
                        if (vIndex !== -1) {
                          page.versions[vIndex] = updatedNode
                        } else {
                          // New version not in cache, try to insert in first page if it fits sort
                          // (This is a simplification, full refetch is usually better for new items in pagination)
                          const sortKey = (arg.sortBy || 'createdAt') as keyof VersionNode
                          const insertIndex = findSortedInsertIndex(
                            page.versions,
                            updatedNode,
                            sortKey,
                            arg.desc || false,
                          )
                          // Only insert if it's within current page bounds or we are on first page
                          if (page === draft.pages[0]) {
                            page.versions.splice(insertIndex, 0, updatedNode)
                          }
                        }
                      }
                    }
                  }
                })
              },
            }),
          )

          // Cleanup: unsubscribe when cache entry is removed
          await cacheEntryRemoved
          PubSub.unsubscribe(token)
          if (unsubscribeThumbnails) {
            unsubscribeThumbnails()
          }
        },
      },
    ),

    // custom query function that fetches versions by multiple parent ids -not infinite and gets 1000 versions max
    getVersionsByProducts: build.query<GetVersionsResult, GetVersionsByProductsArgs>({
      queryFn: async (args, { dispatch, forced }) => {
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
              forceRefetch: forced,
            }),
          )
        }

        // for each product id, call getVersionsByProductId
        const promises = productIds.map((productId) => fetchVersionsPage(productId))

        // wait for all requests to settle (either fulfilled or rejected)
        const settledResults = await Promise.allSettled(promises)

        // Collect all versions from initial queries
        const allVersions: VersionNode[] = []
        const errors: Array<{ productId: string; error: any }> = []

        // Check each result for additional pages and fetch them if needed
        for (let i = 0; i < settledResults.length; i++) {
          const settledResult = settledResults[i]
          const productId = productIds[i]

          // Handle rejected promises
          if (settledResult.status === 'rejected') {
            console.error(`Error fetching versions for product ${productId}:`, settledResult.reason)
            errors.push({ productId, error: parseGQLErrorMessage(settledResult.reason) })
            continue
          }

          // Handle errors in fulfilled promises
          const result = settledResult.value
          if (result.error) {
            console.error(`Error fetching versions for product ${productId}:`, result.error)
            errors.push({
              productId,
              // @ts-expect-error - message
              error: parseGQLErrorMessage(result.error?.message || 'Unknown error'),
            })
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

            if (nextPageResult.error) {
              console.error(
                `Error fetching versions page ${pageCount + 1} for product ${productId}:`,
                nextPageResult.error,
              )
              errors.push({ productId, error: nextPageResult.error })
              break
            }

            if (!nextPageResult.data) break

            allVersions.push(...nextPageResult.data.versions)
            pageInfo = nextPageResult.data.pageInfo
            pageCount++
          }
        }

        // If some requests failed but we have data, log warning but return successful data
        if (errors.length > 0) {
          console.warn(
            `Partial success: ${errors.length} of ${productIds.length} products failed to fetch versions`,
            errors,
          )
        }

        return {
          data: {
            versions: allVersions,
            pageInfo: undefined, // pageInfo is undefined as we've flattened multiple queries
            errors: errors.length > 0 ? errors : undefined,
          },
        }
      },
      keepUnusedDataFor: 30,
      // Subscribes to version entity changes for expanded products
      // Only updates versions that belong to currently expanded products
      onCacheEntryAdded: async (arg, { updateCachedData, cacheEntryRemoved, dispatch }) => {
        let unsubscribeThumbnails: (() => void) | undefined

        unsubscribeThumbnails = subscribeToThumbnailUpdates(
          (messages: ThumbnailUpdateMessage[]) => {
            const relevantMessages = messages.filter((m) => m.project === arg.projectName)
            if (!relevantMessages.length) return

            updateCachedData((draft) => {
              relevantMessages.forEach((message) => {
                if (message.summary.entityType === 'version') {
                  const vIndex = draft.versions.findIndex((v) => v.id === message.summary.entityId)
                  if (vIndex !== -1) {
                    draft.versions[vIndex].thumbnailHash = message.summary.thumbnailHash || ''
                  }
                }
              })
            })
          },
          ['version'],
        )

        const token = PubSub.subscribe(
          'entity.version',
          createVersionUpdateBatcher(arg.projectName, dispatch, {
            getBaseFilters: () => ({
              versionFilter: arg.versionFilter,
              taskFilter: arg.taskFilter,
              productIds: arg.productIds,
            }),
            checkVersionInCache: (entityId, parentId) => {
              if (!parentId || !arg.productIds.includes(parentId)) return false
              let found = false
              updateCachedData((draft) => {
                found = draft.versions.some((v) => v.id === entityId)
              })
              return found
            },
            onBatchUpdate: ({ deleted, patched, attribPatched, fullUpdated }) => {
              updateCachedData((draft) => {
                // Handle deletes
                if (deleted) {
                  for (const { entityId } of deleted) {
                    const vIndex = draft.versions.findIndex((v) => v.id === entityId)
                    if (vIndex !== -1) draft.versions.splice(vIndex, 1)
                  }
                }
                // Handle simple patches
                if (patched) {
                  for (const { entityId, field, value } of patched) {
                    const version = draft.versions.find((v) => v.id === entityId)
                    if (version) {
                      // @ts-expect-error valid field
                      version[field] = value
                    }
                  }
                }
                // Handle attrib patches
                if (attribPatched) {
                  for (const { entityId, allAttrib, parsedAttrib } of attribPatched) {
                    const version = draft.versions.find((v) => v.id === entityId)
                    if (version) {
                      version.allAttrib = allAttrib
                      version.attrib = parsedAttrib
                    }
                  }
                }
                // Handle full updates
                if (fullUpdated) {
                  for (const updatedNode of fullUpdated) {
                    const index = draft.versions.findIndex((v) => v.id === updatedNode.id)
                    if (index !== -1) {
                      draft.versions[index] = updatedNode
                    } else {
                      // Add at correct sorted position
                      const sortKey = (arg.sortBy || 'createdAt') as keyof VersionNode
                      const insertIndex = findSortedInsertIndex(
                        draft.versions,
                        updatedNode,
                        sortKey,
                        arg.desc || false,
                      )
                      draft.versions.splice(insertIndex, 0, updatedNode)
                    }
                  }
                }
              })
            },
          }),
        )

        // Cleanup: unsubscribe when cache entry is removed
        await cacheEntryRemoved
        PubSub.unsubscribe(token)
        if (unsubscribeThumbnails) {
          unsubscribeThumbnails()
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
                queryParams.last = VP_INFINITE_QUERY_COUNT
              } else {
                queryParams.after = cursor || undefined
                queryParams.first = VP_INFINITE_QUERY_COUNT
              }
            } else {
              queryParams.after = cursor || undefined
              queryParams.first = VP_INFINITE_QUERY_COUNT
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
            return {
              error: {
                status: 'FETCH_ERROR',
                error: parseGQLErrorMessage(e.message),
              } as FetchBaseQueryError,
            }
          }
        },
        providesTags: provideTagsForProductsInfinite,
        keepUnusedDataFor: 30,

        // Subscribes to product entity changes and updates cache accordingly
        // Handles: create, update, delete operations
        // Often triggered together with version changes (new product + version)

        onCacheEntryAdded: async (arg, { updateCachedData, cacheEntryRemoved, dispatch }) => {
          let unsubscribeThumbnails: (() => void) | undefined

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              const relevantMessages = messages.filter((m) => m.project === arg.projectName)
              if (!relevantMessages.length) return

              updateCachedData((draft) => {
                relevantMessages.forEach((message) => {
                  if (message.summary.entityType === 'version') {
                    draft.pages.forEach((page) => {
                      page.products.forEach((p) => {
                        if (p.featuredVersion?.id === message.summary.entityId) {
                          p.featuredVersion.thumbnailHash = message.summary.thumbnailHash || ''
                        }
                      })
                    })
                  }
                })
              })
            },
            ['version'],
          )

          // Helper to refetch and update a product in cache
          const refetchProduct = async (productId: string) => {
            const queryParams: any = {
              projectName: arg.projectName,
              productIds: [productId],
              productFilter: arg.productFilter,
              versionFilter: arg.versionFilter,
              taskFilter: arg.taskFilter,
              folderIds: arg.folderIds?.length ? arg.folderIds : undefined,
              first: 1,
            }

            const result = await dispatch(
              enhancedVersionsPageApi.endpoints.GetProducts.initiate(queryParams, {
                forceRefetch: true,
              }),
            )

            if (result.error) return

            // Update the cache: update existing, delete if not found, or add new
            updateCachedData((draft) => {
              const updatedProduct = result.data?.products?.[0]
              updatePagedCache(
                draft.pages,
                productId,
                updatedProduct,
                'products',
                (arg.sortBy || 'createdAt') as keyof ProductNode,
                arg.desc || false,
              )
            })
          }

          // Subscribe to product entity changes from websocket
          const productToken = PubSub.subscribe(
            'entity.product',
            async (_topic: string, message: any) => {
              try {
                const entityId = message.summary?.entityId
                if (!entityId) return

                let productExistsInCache = false
                updateCachedData((draft) => {
                  productExistsInCache = draft.pages.some((page) =>
                    page.products.some((product: ProductNode) => product.id === entityId),
                  )
                })

                if (!productExistsInCache && _topic !== 'entity.product.created') return

                await refetchProduct(entityId)
              } catch (error) {
                // Silently handle errors to prevent UI disruption
              }
            },
          )

          // Subscribe to version entity changes - refetch parent product when version changes
          // This ensures product's versions list and featuredVersion stay up-to-date
          const versionToken = PubSub.subscribe(
            'entity.version',
            createVersionUpdateBatcher(arg.projectName, dispatch, {
              getBaseFilters: () => ({
                versionFilter: arg.versionFilter,
                productFilter: arg.productFilter,
                taskFilter: arg.taskFilter,
                folderIds: arg.folderIds?.length ? arg.folderIds : undefined,
              }),
              checkVersionInCache: (entityId, parentId) => {
                let found = false
                updateCachedData((draft) => {
                  found = draft.pages.some((page) =>
                    page.products.some(
                      (p) => p.id === parentId && p.featuredVersion?.id === entityId,
                    ),
                  )
                })
                return found
              },
              onBatchUpdate: ({ deleted, patched, attribPatched, fullUpdated }) => {
                updateCachedData((draft) => {
                  for (const page of draft?.pages || []) {
                    for (const p of page.products) {
                      const featuredId = p.featuredVersion?.id
                      if (!featuredId) continue

                      // Handle deletes
                      if (deleted) {
                        if (deleted.some((d) => d.entityId === featuredId && d.parentId === p.id)) {
                          // Version deleted, need to refetch product to update featuredVersion
                          // Using a set to track which products need refetch to avoid multiple calls
                          productsToRefetch.add(p.id)
                        }
                      }

                      // Handle simple patches
                      if (patched) {
                        for (const { entityId, field, value, parentId } of patched) {
                          if (p.id === parentId && featuredId === entityId && p.featuredVersion) {
                            // @ts-expect-error valid field
                            p.featuredVersion[field] = value
                          }
                        }
                      }

                      // Handle attrib patches
                      if (attribPatched) {
                        for (const { entityId, allAttrib, parsedAttrib } of attribPatched) {
                          if (featuredId === entityId && p.featuredVersion) {
                            p.featuredVersion.allAttrib = allAttrib
                            p.featuredVersion.attrib = parsedAttrib
                          }
                        }
                      }

                      // Handle full updates
                      if (fullUpdated) {
                        for (const updatedNode of fullUpdated) {
                          if (featuredId === updatedNode.id && p.featuredVersion) {
                            p.featuredVersion = updatedNode
                          }
                        }
                      }
                    }
                  }
                })

                // If any products need full refetch (due to deletes or new version becoming featured)
                // we trigger that now
                for (const productId of productsToRefetch) {
                  refetchProduct(productId)
                }
                productsToRefetch.clear()
              },
            }),
          )

          const productsToRefetch = new Set<string>()

          // Cleanup: unsubscribe when cache entry is removed
          await cacheEntryRemoved
          PubSub.unsubscribe(productToken)
          PubSub.unsubscribe(versionToken)
          if (unsubscribeThumbnails) {
            unsubscribeThumbnails()
          }
        },
      },
    ),

    // Grouped versions query - fetches versions for multiple group filters
    getGroupedVersionsList: build.query<GetGroupedVersionsListResult, GetGroupedVersionsListArgs>({
      queryFn: async (
        {
          projectName,
          groups,
          groupFilterKey = 'versionFilter',
          versionFilter, // most of the time overridden by group filters
          productFilter,
          taskFilter,
          folderIds,
          desc,
          sortBy,
          featuredOnly,
          hasReviewables,
        },
        api,
      ) => {
        try {
          const promises = []
          for (const group of groups) {
            const count = group.count || 500

            const queryParams: GetVersionsQueryVariables = {
              projectName,
              // base filters
              productFilter,
              taskFilter,
              versionFilter,
              // specific group filter
              [groupFilterKey]: group.filter,
              folderIds: folderIds?.length ? folderIds : undefined,
              sortBy: sortBy,
              featuredOnly,
              hasReviewables,
              // @ts-expect-error - group param used later on
              group: group.value,
            }

            if (desc) {
              queryParams.last = count
            } else {
              queryParams.first = count
            }

            const promise = api.dispatch(
              enhancedVersionsPageApi.endpoints.GetVersions.initiate(queryParams, {
                forceRefetch: true,
              }),
            )
            promises.push(promise)
          }

          const result = await Promise.all(promises)
          const versions: VersionNode[] = []

          for (const res of result) {
            if (res.error) throw res.error

            // get group value
            // @ts-expect-error - we know group does exist on res.originalArgs
            const groupValue = res.originalArgs?.group as string

            const hasNextPage =
              res.data?.pageInfo?.hasNextPage || res.data?.pageInfo?.hasPreviousPage || false

            const groupVersions =
              res.data?.versions.map((version, i, a) => ({
                ...version,
                groups: [
                  {
                    value: groupValue,
                    hasNextPage: i === a.length - 1 && hasNextPage ? groupValue : undefined,
                  },
                ],
              })) || []

            versions.push(...groupVersions)
          }

          return {
            data: {
              versions,
            },
          }
        } catch (error: any) {
          console.error('Error in getGroupedVersionsList queryFn:', error)
          return {
            error: {
              status: 'FETCH_ERROR',
              error: parseGQLErrorMessage(error.message),
            } as FetchBaseQueryError,
          }
        }
      },
      providesTags: provideTagsForVersionsResult,
      keepUnusedDataFor: 30,
      // Subscribes to version entity changes and updates cache accordingly
      // Handles: create, update, delete operations for grouped versions view
      onCacheEntryAdded: async (arg, { updateCachedData, cacheEntryRemoved, dispatch }) => {
        let unsubscribeThumbnails: (() => void) | undefined

        unsubscribeThumbnails = subscribeToThumbnailUpdates(
          (messages: ThumbnailUpdateMessage[]) => {
            const relevantMessages = messages.filter((m) => m.project === arg.projectName)
            if (!relevantMessages.length) return

            updateCachedData((draft) => {
              relevantMessages.forEach((message) => {
                if (message.summary.entityType === 'version') {
                  const vIndex = draft.versions.findIndex((v) => v.id === message.summary.entityId)
                  if (vIndex !== -1) {
                    draft.versions[vIndex].thumbnailHash = message.summary.thumbnailHash || ''
                  }
                }
              })
            })
          },
          ['version'],
        )

        const token = PubSub.subscribe(
          'entity.version',
          createVersionUpdateBatcher(arg.projectName, dispatch, {
            getBaseFilters: () => ({
              versionFilter: arg.versionFilter,
              productFilter: arg.productFilter,
              taskFilter: arg.taskFilter,
              folderIds: arg.folderIds?.length ? arg.folderIds : undefined,
              sortBy: arg.sortBy,
              featuredOnly: arg.featuredOnly,
              hasReviewables: arg.hasReviewables,
            }),
            checkVersionInCache: (entityId) => {
              let found = false
              updateCachedData((draft) => {
                found = draft.versions.some((v) => v.id === entityId)
              })
              return found
            },
            onBatchUpdate: ({ deleted, patched, attribPatched, fullUpdated }) => {
              updateCachedData((draft) => {
                // Handle deletes
                if (deleted) {
                  for (const { entityId } of deleted) {
                    const vIndex = draft.versions.findIndex((v) => v.id === entityId)
                    if (vIndex !== -1) draft.versions.splice(vIndex, 1)
                  }
                }
                // Handle patches
                if (patched) {
                  for (const { entityId, field, value } of patched) {
                    const version = draft.versions.find((v) => v.id === entityId)
                    if (version) {
                      // @ts-expect-error valid field
                      version[field] = value
                    }
                  }
                }
                // Handle attrib patches
                if (attribPatched) {
                  for (const { entityId, allAttrib, parsedAttrib } of attribPatched) {
                    const version = draft.versions.find((v) => v.id === entityId)
                    if (version) {
                      version.allAttrib = allAttrib
                      version.attrib = parsedAttrib
                    }
                  }
                }
                // Handle full updates
                if (fullUpdated) {
                  for (const updatedNode of fullUpdated) {
                    const index = draft.versions.findIndex((v) => v.id === updatedNode.id)
                    if (index !== -1) {
                      // Preserve groups when updating
                      const originalGroups = draft.versions[index].groups
                      draft.versions[index] = { ...updatedNode, groups: originalGroups }
                    }
                  }
                }
              })
            },
          }),
        )

        // Cleanup: unsubscribe when cache entry is removed
        await cacheEntryRemoved
        PubSub.unsubscribe(token)
        if (unsubscribeThumbnails) {
          unsubscribeThumbnails()
        }
      },
    }),
  }),
})

// export gql endpoints
export const {
  useGetVersionsQuery,
  useGetProductsColumnStatsQuery,
  useGetVersionsColumnStatsQuery,
} = enhancedVersionsPageApi
// export custom queries
export const {
  useGetVersionsInfiniteInfiniteQuery: useGetVersionsInfiniteQuery,
  useGetVersionsByProductsQuery,
  useGetProductsInfiniteInfiniteQuery: useGetProductsInfiniteQuery,
  useGetGroupedVersionsListQuery,
} = injectedVersionsPageApi

// export API instances for cache manipulation
export { enhancedVersionsPageApi, injectedVersionsPageApi }
