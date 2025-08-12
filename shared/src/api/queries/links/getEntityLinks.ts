import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  GetFoldersLinksQuery,
  GetTasksLinksQuery,
  GetProductsLinksQuery,
  GetVersionsLinksQuery,
  GetRepresentationsLinksQuery,
  GetWorkfilesLinksQuery,
  gqlLinksApi,
  foldersApi,
} from '@shared/api/generated'
import { formatEntityLabel } from './utils/formatEntityLinks'

/**
 * Custom queryFn for fetching entity links with optimized caching behavior.
 *
 * Key features:
 * 1. Single cache per project and entity type - different entityIds combinations don't create new caches
 * 2. Skips fetching entities that are already cached
 * 3. Force refetch when entityIds change
 * 4. Merges new entities into cache without duplicates
 * 5. Supports all entity types: folders, tasks, products, versions, representations, workfiles
 */

// Define the arguments for the query
export type GetEntityLinksArgs = {
  projectName: string
  entityIds: string[]
  entityType: 'folder' | 'task' | 'product' | 'version' | 'representation' | 'workfile'
}

// Define link types for each entity
export type FolderLink =
  GetFoldersLinksQuery['project']['folders']['edges'][0]['node']['links']['edges'][0]
export type TaskLink =
  GetTasksLinksQuery['project']['tasks']['edges'][0]['node']['links']['edges'][0]
export type ProductLink =
  GetProductsLinksQuery['project']['products']['edges'][0]['node']['links']['edges'][0]
export type VersionLink =
  GetVersionsLinksQuery['project']['versions']['edges'][0]['node']['links']['edges'][0]
export type RepresentationLink =
  GetRepresentationsLinksQuery['project']['representations']['edges'][0]['node']['links']['edges'][0]
export type WorkfileLink =
  GetWorkfilesLinksQuery['project']['workfiles']['edges'][0]['node']['links']['edges'][0]

export type EntityLinkQuery =
  | FolderLink
  | TaskLink
  | ProductLink
  | VersionLink
  | RepresentationLink
  | WorkfileLink
export type EntityLink = Pick<EntityLinkQuery, 'direction' | 'entityType' | 'id' | 'linkType'> & {
  node: Pick<EntityLinkQuery['node'], 'name' | 'id'> & {
    label?: string | null
    parents: string[]
    subType: string | undefined
  }
}

// Define the result type for the query - simplified without edges wrapper
export type EntityWithLinks = {
  id: string
  links: EntityLink[]
}

export type GetEntityLinksResult = EntityWithLinks[]

// Map entity types to their corresponding GraphQL endpoints
const entityEndpoints = {
  folder: 'GetFoldersLinks',
  task: 'GetTasksLinks',
  product: 'GetProductsLinks',
  version: 'GetVersionsLinks',
  representation: 'GetRepresentationsLinks',
  workfile: 'GetWorkfilesLinks',
} as const

// Map entity types to their result path in the GraphQL response
const entityResultPaths = {
  folder: 'folders',
  task: 'tasks',
  product: 'products',
  version: 'versions',
  representation: 'representations',
  workfile: 'workfiles',
} as const

const injectedQueries = foldersApi.injectEndpoints({
  endpoints: (build) => ({
    getEntityLinks: build.query<GetEntityLinksResult, GetEntityLinksArgs>({
      queryFn: async (
        { projectName, entityIds, entityType },
        { getState, dispatch, queryCacheKey, forced },
      ) => {
        try {
          // Get current state to access cached data
          const state = getState() as any
          const cacheKey = JSON.stringify({ projectName, entityType })

          // Access the cache entry for this project and entity type
          const cacheEntry =
            state.restApi?.queries?.[queryCacheKey || `getEntityLinks(${cacheKey})`]
          const cachedData = cacheEntry?.data || []

          // 1. When fetching new data for entityIds, we should skip entities that are already in the cache.
          const cachedEntityIds = new Set(cachedData.map((entity: EntityWithLinks) => entity.id))
          const entityIdsToFetch = entityIds.filter((id) => !cachedEntityIds?.has(id) || forced)

          // If all entities are already cached, return the cached data
          if (entityIdsToFetch.length === 0) {
            return { data: cachedData }
          }

          // Get the appropriate endpoint and parameter names
          const endpoint = entityEndpoints[entityType]
          const resultPath = entityResultPaths[entityType]

          // Fetch only the entities that aren't already cached
          const result = await dispatch(
            (gqlLinksApi.endpoints as any)[endpoint].initiate(
              { projectName, entityIds: entityIdsToFetch },
              { forceRefetch: true },
            ),
          ).unwrap()

          const newEntities =
            result.project?.[resultPath]?.edges?.map(({ node }: { node: any }) => ({
              id: node.id,
              links:
                node.links.edges?.map((linkEdge: EntityLinkQuery) => ({
                  ...linkEdge,
                  node: {
                    id: linkEdge.node.id,
                    name: linkEdge.node.name,
                    label: formatEntityLabel(linkEdge.node),
                    parents: linkEdge.node.parents || [],
                    subType: 'subType' in linkEdge.node ? linkEdge.node.subType : undefined,
                  },
                })) || [], // Flatten the edges structure
            })) || []

          // Return the new entities - the merge function will handle combining with existing cache
          return { data: newEntities }
        } catch (error: any) {
          console.error(`Error in getEntityLinks queryFn for ${entityType}:`, error)
          return { error: { status: 'FETCH_ERROR', error: error.message } as FetchBaseQueryError }
        }
      },
      // 2. We should not create new caches when the entityIds argument changes.
      serializeQueryArgs: ({ queryArgs }) => {
        // Use only projectName and entityType for the cache key, ignoring entityIds
        return { projectName: queryArgs.projectName, entityType: queryArgs.entityType }
      },
      // 3. We should force a refetch every time the entityIds changes.
      forceRefetch: ({ currentArg, previousArg }) => {
        // Force refetch if entityIds array is different
        if (!currentArg || !previousArg) return true

        // Compare arrays by converting to sets
        const currentIds = new Set(currentArg.entityIds)
        const previousIds = new Set(previousArg.entityIds)

        if (currentIds.size !== previousIds.size) return true

        // Check if any IDs are different
        for (const id of currentIds) {
          if (!previousIds.has(id)) return true
        }

        return false
      },
      // 4. We should merge new entities into the cache ensuring there are no duplicates.
      merge: (currentCache, newItems) => {
        if (!currentCache) return newItems

        const cacheMap = new Map(currentCache.map((item) => [item.id, item]))
        for (const newItem of newItems) {
          cacheMap.set(newItem.id, newItem) // Overwrite if exists, add if not
        }
        // Update currentCache in-place
        currentCache.length = 0
        currentCache.push(...cacheMap.values())
      },
      // Provide tags for potential invalidation
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.flatMap((entity) =>
                entity.links.map((link) => ({ type: 'link', id: link.node.id })),
              ),
              { type: 'link', id: `${arg.projectName}-${arg.entityType}` },
            ]
          : [{ type: 'link', id: `${arg.projectName}-${arg.entityType}` }],
    }),
  }),
})

export const { useGetEntityLinksQuery } = injectedQueries
export { injectedQueries as entityLinksApi }
