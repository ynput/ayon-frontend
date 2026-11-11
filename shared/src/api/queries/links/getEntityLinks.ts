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
import { toast } from 'react-toastify'
import { createRealtimeBatcher, PubSub, waitForRealtimeJitter } from '@shared/util'
import { normalizeQueryError } from '@shared/api/base/queryError'
import { chunk } from 'lodash'
import { useEffect, useMemo, useState } from 'react'

// entities per links request, more are fetched in further requests
const LINKS_BATCH_SIZE = 100
// a failing batch is tried this many times before the query fails
const LINKS_BATCH_ATTEMPTS = 3

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
  // see useGetEntityLinksInBatchesQuery
  afterRequest?: number
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
  node:
    | (EntityLinkQuery['node'] & {
        name: string
        id: string
        label?: string | null
        parents: string[]
        subType: string | undefined
      })
    | null
  isRestricted?: boolean // flag to indicate if this link is restricted
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

// asks for the links of one batch, trying again before giving up
const fetchLinksBatch = async (
  dispatch: (action: any) => any,
  endpoint: string,
  projectName: string,
  entityIds: string[],
) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await dispatch(
        (gqlLinksApi.endpoints as any)[endpoint].initiate(
          { projectName, entityIds },
          { forceRefetch: true, subscribe: false },
        ),
      ).unwrap()
    } catch (error) {
      if (attempt >= LINKS_BATCH_ATTEMPTS) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

const toEntityWithLinks = (node: any): EntityWithLinks => {
  // Log restricted links
  const restrictedLinks = node.links.edges?.filter((e: EntityLinkQuery | null) => !e?.node) || []
  if (restrictedLinks.length > 0) {
    console.log(
      `[RESTRICTED LINKS] Entity ${node.id} (${node.name}) has ${restrictedLinks.length} restricted link(s):`,
      restrictedLinks.map((link: any) => ({
        linkId: link?.id,
        linkType: link?.linkType,
        direction: link?.direction,
        entityType: link?.entityType,
        nodeIsNull: !link?.node,
      })),
    )
  }

  return {
    id: node.id,
    links:
      node.links.edges?.map((linkEdge: EntityLinkQuery | null) => {
        if (!linkEdge?.node) {
          // Restricted link - node is null
          return {
            ...linkEdge,
            node: null,
            isRestricted: true,
          } as EntityLink
        }
        // Normal link
        return {
          ...linkEdge,
          node: {
            id: linkEdge.node.id,
            name: linkEdge.node.name,
            label: formatEntityLabel(linkEdge.node),
            parents: linkEdge.node.parents || [],
            subType: 'subType' in linkEdge.node ? linkEdge.node.subType : undefined,
          },
          isRestricted: false,
        } as EntityLink
      }) || [], // Flatten the edges structure
  }
}

// merges entities into the cached ones, replacing those with the same id
const mergeEntitiesWithLinks = (cache: EntityWithLinks[], entities: EntityWithLinks[]) => {
  const cacheMap = new Map(cache.map((item) => [item.id, item]))
  for (const entity of entities) cacheMap.set(entity.id, entity)
  cache.length = 0
  cache.push(...cacheMap.values())
}

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

          // Fetch only the entities that aren't already cached, one batch after another to keep
          // the load per user down. A refresh writes each batch into the cache as it arrives, so a
          // realtime update made meanwhile is not replaced by an older response at the end.
          const writesBatches = forced && cacheEntry?.data !== undefined
          const newEntities: EntityWithLinks[] = []
          for (const batchIds of chunk(entityIdsToFetch, LINKS_BATCH_SIZE)) {
            const result = await fetchLinksBatch(dispatch, endpoint, projectName, batchIds)
            const entities: EntityWithLinks[] = (result.project?.[resultPath]?.edges || []).map(
              ({ node }: { node: any }) => toEntityWithLinks(node),
            )
            // entities the server leaves out (deleted since the rows loaded) have no links, and
            // caching them keeps them from holding up the next batch
            const returnedIds = new Set(entities.map((entity) => entity.id))
            for (const id of batchIds) if (!returnedIds.has(id)) entities.push({ id, links: [] })

            if (writesBatches) {
              dispatch(
                injectedQueries.util.updateQueryData(
                  'getEntityLinks',
                  { projectName, entityIds, entityType },
                  (draft) => mergeEntitiesWithLinks(draft, entities),
                ),
              )
            } else {
              newEntities.push(...entities)
            }
          }

          // Return the new entities - the merge function will handle combining with existing cache
          return { data: newEntities }
        } catch (error: any) {
          console.error(`Error in getEntityLinks queryFn for ${entityType}:`, error)
          toast.error(`Error fetching ${entityType} links`)
          return { error: normalizeQueryError(error) }
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
        mergeEntitiesWithLinks(currentCache, newItems)
      },
      // Provide tags for potential invalidation
      providesTags: (result, error, arg) =>
        result
          ? [
              ...result.flatMap((entity) =>
                entity.links
                  .filter((link) => link.node !== null)
                  .map((link) => ({ type: 'link', id: link.node!.id as string })),
              ),
              ...arg.entityIds.map((id) => ({ type: 'link', id })),
              { type: 'link', id: `${arg.projectName}-${arg.entityType}` },
            ]
          : [{ type: 'link', id: `${arg.projectName}-${arg.entityType}` }],
      // Subscribe to link.created and link.deleted WebSocket events
      async onCacheEntryAdded(
        { projectName, entityType },
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData, dispatch },
      ) {
        let token: any
        const batcher = createRealtimeBatcher(
          async (items: { entityId: string }[], isActive) => {
            const endpoint = entityEndpoints[entityType]
            const resultPath = entityResultPaths[entityType]

            try {
              await waitForRealtimeJitter()
              const result = await dispatch(
                (gqlLinksApi.endpoints as any)[endpoint].initiate(
                  { projectName, entityIds: items.map(({ entityId }) => entityId) },
                  { forceRefetch: true },
                ),
              ).unwrap()

              if (!isActive()) return

              const updatedEntities =
                result.project?.[resultPath]?.edges?.map(({ node }: { node: any }) => {
                  return {
                    id: node.id,
                    links:
                      node.links.edges?.map((linkEdge: EntityLinkQuery | null) => {
                        if (!linkEdge?.node) {
                          return {
                            ...linkEdge,
                            node: null,
                            isRestricted: true,
                          } as EntityLink
                        }
                        return {
                          ...linkEdge,
                          node: {
                            id: linkEdge.node.id,
                            name: linkEdge.node.name,
                            label: formatEntityLabel(linkEdge.node),
                            parents: linkEdge.node.parents || [],
                            subType: 'subType' in linkEdge.node ? linkEdge.node.subType : undefined,
                          },
                          isRestricted: false,
                        } as EntityLink
                      }) || [],
                  }
                }) || []

              updateCachedData((draft: EntityWithLinks[]) => {
                for (const updatedEntity of updatedEntities) {
                  const idx = draft.findIndex((entity) => entity.id === updatedEntity.id)
                  if (idx > -1) draft[idx] = updatedEntity
                  else draft.push(updatedEntity)
                }
              })
            } catch (err) {
              console.error('Realtime link batch update failed', err)
            }
          },
          ({ entityId }) => entityId,
        )

        try {
          await cacheDataLoaded

          const handlePubSub = (_topic: string, message: any) => {
            // Only react to link.created and link.deleted events for this project
            if (!_topic.startsWith('link.created') && !_topic.startsWith('link.deleted')) return
            if (message?.project !== projectName) return

            // Link events have inputId and outputId in the summary (both entities affected by the link)
            const inputId = message?.summary?.inputId
            const outputId = message?.summary?.outputId
            if (!inputId && !outputId) return

            if (inputId) batcher.add({ entityId: inputId })
            if (outputId) batcher.add({ entityId: outputId })
          }

          // Subscribe to link events
          // NOTE: backend emits topics like 'link.created' and 'link.deleted'.
          // PubSub supports prefix matching when subscribing.
          token = PubSub.subscribe('link', handlePubSub)
        } catch (e) {
          // cache entry removed before loaded - ignore
        }

        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
        batcher.clear()
      },
    }),
  }),
})

export const { useGetEntityLinksQuery } = injectedQueries

/**
 * useGetEntityLinksQuery for many entities: asks for one batch of uncached entities at a time, so
 * the first rows show their links while the rest are still loading.
 */
export const useGetEntityLinksInBatchesQuery = (
  args: GetEntityLinksArgs,
  options?: { skip?: boolean; priorityIds?: string[] },
) => {
  const { projectName, entityType, entityIds } = args
  // one cache entry holds the links of every entity of the project and type
  const { data: cachedEntities, fulfilledTimeStamp } =
    injectedQueries.endpoints.getEntityLinks.useQueryState(args)
  // a batch that failed is left out, so the batches after it still load
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set())
  useEffect(() => setFailedIds(new Set()), [projectName, entityType])
  const idsKey = entityIds.join(',')
  const priorityKey = options?.priorityIds?.join(',') ?? ''

  const { batchArgs, cachedIds, hasMore } = useMemo(() => {
    const cachedIds = new Set(cachedEntities?.map((entity) => entity.id))
    const priority = new Set(options?.priorityIds)
    const cached = entityIds.filter((id) => cachedIds.has(id))
    // rows on screen first, so their links load before those scrolled out of view
    const uncached = entityIds
      .filter((id) => !cachedIds.has(id) && !failedIds.has(id))
      .sort((a, b) => Number(priority.has(b)) - Number(priority.has(a)))
    const batchIds = uncached.slice(0, LINKS_BATCH_SIZE)
    return {
      cachedIds,
      hasMore: uncached.length > LINKS_BATCH_SIZE,
      batchArgs: {
        projectName,
        entityType,
        entityIds: [...cached, ...batchIds],
        // changes once a request is done, so the next batch is asked for even when the same
        // ids were already asked for while that request ran (RTK Query drops those)
        afterRequest: fulfilledTimeStamp,
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectName, entityType, idsKey, priorityKey, cachedEntities, failedIds, fulfilledTimeStamp])

  const result = useGetEntityLinksQuery(batchArgs, { skip: options?.skip })

  // the uncached entities of the request that failed, not of the next batch
  const failedBatchKey = result.isError
    ? (result.originalArgs?.entityIds ?? []).filter((id) => !cachedIds.has(id)).join(',')
    : ''
  useEffect(() => {
    if (!failedBatchKey) return
    setFailedIds((ids) => new Set([...ids, ...failedBatchKey.split(',')]))
  }, [failedBatchKey])

  // entities waiting for a later batch count as loading
  const isWaiting = !options?.skip && hasMore
  return { ...result, isFetching: result.isFetching || isWaiting }
}
export { injectedQueries as entityLinksApi }
