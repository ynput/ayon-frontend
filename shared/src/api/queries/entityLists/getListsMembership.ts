import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { gqlApi } from '@shared/api/generated'
import type { ListMembershipFragmentFragment } from '@shared/api/generated'
import { normalizeQueryError } from '@shared/api/base/queryError'
import { createRealtimeBatcher, PubSub, waitForRealtimeJitter } from '@shared/util'
import type { ListItemMessage } from './types'

export type ListMembership = ListMembershipFragmentFragment
export type ListsMembershipEntityType = 'folder' | 'task' | 'version'
export const LISTS_MEMBERSHIP_ENTITY_TYPES: ListsMembershipEntityType[] = [
  'folder',
  'task',
  'version',
]

export type GetListsMembershipArgs = {
  projectName: string
  entityType: ListsMembershipEntityType
  entityIds: string[]
}

// entity id -> active lists the entity is in
export type ListsMembershipMap = Record<string, ListMembership[]>

const CHUNK_SIZE = 500

type MembershipNode = { id: string; entityLists: ListMembership[] }

const fetchMembership = async (
  dispatch: (action: any) => any,
  { projectName, entityType, entityIds }: GetListsMembershipArgs,
): Promise<ListsMembershipMap> => {
  const options = { forceRefetch: true, subscribe: false }

  const fetchChunk = async (ids: string[]): Promise<MembershipNode[]> => {
    const args = { projectName, entityIds: ids }
    if (entityType === 'folder') {
      const res = await dispatch(
        gqlApi.endpoints.GetFoldersListsMembership.initiate(args, options),
      ).unwrap()
      return res.project.folders.edges.map(({ node }: { node: MembershipNode }) => node)
    }
    if (entityType === 'task') {
      const res = await dispatch(
        gqlApi.endpoints.GetTasksListsMembership.initiate(args, options),
      ).unwrap()
      return res.project.tasks.edges.map(({ node }: { node: MembershipNode }) => node)
    }
    const res = await dispatch(
      gqlApi.endpoints.GetVersionsListsMembership.initiate(args, options),
    ).unwrap()
    return res.project.versions.edges.map(({ node }: { node: MembershipNode }) => node)
  }

  const chunks: string[][] = []
  for (let i = 0; i < entityIds.length; i += CHUNK_SIZE) {
    chunks.push(entityIds.slice(i, i + CHUNK_SIZE))
  }
  const nodes = (await Promise.all(chunks.map(fetchChunk))).flat()

  const membership: ListsMembershipMap = {}
  for (const id of entityIds) membership[id] = []
  for (const node of nodes) membership[node.id] = node.entityLists
  return membership
}

const getCachedMembership = (getState: () => unknown, queryCacheKey?: string): ListsMembershipMap =>
  (queryCacheKey && (getState() as any)[gqlApi.reducerPath]?.queries?.[queryCacheKey]?.data) || {}

const listsMembershipApi = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    // One cache per project and entity type. Each call only fetches the ids that are not cached yet.
    // The query returns the whole map instead of using `merge`: RTK builds `providesTags` from the
    // query's own result, so returning only the new ids would drop the tags of everything cached.
    getListsMembership: build.query<ListsMembershipMap, GetListsMembershipArgs>({
      queryFn: async (args, { dispatch, getState, queryCacheKey, forced }) => {
        try {
          // invalidated or refetched: fetch the ids on screen and drop the rest, which would be
          // stale, so they are fetched again when they scroll back into view
          if (forced) return { data: await fetchMembership(dispatch, args) }

          const cached = getCachedMembership(getState, queryCacheKey)
          const missingIds = args.entityIds.filter((id) => !cached[id])
          if (!missingIds.length) return { data: cached }

          const fetched = await fetchMembership(dispatch, { ...args, entityIds: missingIds })
          // read the cache again, a realtime update may have changed it during the fetch
          return { data: { ...getCachedMembership(getState, queryCacheKey), ...fetched } }
        } catch (error) {
          return { error: normalizeQueryError(error) }
        }
      },
      serializeQueryArgs: ({ queryArgs: { projectName, entityType } }) => ({
        projectName,
        entityType,
      }),
      forceRefetch: ({ currentArg, previousArg }) => {
        if (!currentArg || !previousArg) return true
        if (currentArg.entityIds.length !== previousArg.entityIds.length) return true
        const previousIds = new Set(previousArg.entityIds)
        return currentArg.entityIds.some((id) => !previousIds.has(id))
      },
      providesTags: (result) => {
        const listIds = new Set(
          Object.values(result || {}).flatMap((lists) => lists.map((list) => list.id)),
        )
        return [
          ...Object.keys(result || {}).map((id) => ({ type: 'entityListItem' as const, id })),
          ...Array.from(listIds).map((id) => ({ type: 'entityList' as const, id })),
        ]
      },
      // List events name the list and its entity type, but not which entities changed. Events for
      // lists of this entity type share one batch key, so a burst of them ends in one refetch of
      // every cached entity, which replaces their lists.
      async onCacheEntryAdded(
        { projectName, entityType },
        { cacheDataLoaded, cacheEntryRemoved, getCacheEntry, updateCachedData, dispatch },
      ) {
        let token: string | undefined
        const batcher = createRealtimeBatcher<string>(
          async (_listIds, isActive) => {
            const entityIds = Object.keys(getCacheEntry().data || {})
            if (!entityIds.length) return
            await waitForRealtimeJitter()
            // a failed fetch is logged by the base client and the batcher
            const fresh = await fetchMembership(dispatch, { projectName, entityType, entityIds })
            if (!isActive()) return
            updateCachedData((draft) => {
              for (const [entityId, lists] of Object.entries(fresh)) {
                // dropped by a forced refetch during the fetch
                if (draft[entityId]) draft[entityId] = lists
              }
            })
          },
          () => 'membership',
        )

        try {
          await cacheDataLoaded
          token = PubSub.subscribe('entity_list', (_topic: string, message: ListItemMessage) => {
            const { id, entity_type } = message?.summary || {}
            if (message?.project !== projectName || entity_type !== entityType || !id) return
            batcher.add(id)
          })
        } catch {
          // cache entry removed before it loaded
        }

        await cacheEntryRemoved
        if (token) PubSub.unsubscribe(token)
        batcher.clear()
      },
    }),
  }),
})

export const { useGetListsMembershipQuery } = listsMembershipApi
export { listsMembershipApi }

// For the pages' refresh/sync button: refetch the lists of the entities on screen, for every
// entity type cached for the project. Forced, so entities off screen are dropped and fetched again
// when they scroll back into view.
export const refreshListsMembership =
  (projectName: string) =>
  (dispatch: ThunkDispatch<any, any, UnknownAction>, getState: () => any) =>
    Promise.all(
      listsMembershipApi.util
        .selectCachedArgsForQuery(getState(), 'getListsMembership')
        .filter((args) => args.projectName === projectName)
        .map((args) =>
          dispatch(
            listsMembershipApi.endpoints.getListsMembership.initiate(args, {
              forceRefetch: true,
              subscribe: false,
            }),
          ),
        ),
    )
