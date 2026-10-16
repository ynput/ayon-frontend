import { gqlApi } from '@shared/api/generated'
import type { ListMembershipFragmentFragment } from '@shared/api/generated'
import { normalizeQueryError } from '@shared/api/base/queryError'
import { createRealtimeBatcher, PubSub, waitForRealtimeJitter } from '@shared/util'

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

const listsMembershipApi = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    // One cache per project and entity type. Each call only fetches the ids that are not cached yet.
    getListsMembership: build.query<ListsMembershipMap, GetListsMembershipArgs>({
      queryFn: async (args, { dispatch, getState, queryCacheKey, forced }) => {
        try {
          const cached: ListsMembershipMap =
            (queryCacheKey && (getState() as any).restApi?.queries?.[queryCacheKey]?.data) || {}
          const entityIds = forced ? args.entityIds : args.entityIds.filter((id) => !cached[id])
          if (!entityIds.length) return { data: {} }

          return { data: await fetchMembership(dispatch, { ...args, entityIds }) }
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
      merge: (currentCache, newItems) => {
        Object.assign(currentCache, newItems)
      },
      providesTags: (result, _error, { entityIds }) => {
        const listIds = new Set(
          Object.values(result || {}).flatMap((lists) => lists.map((list) => list.id)),
        )
        return [
          ...entityIds.map((id) => ({ type: 'entityListItem' as const, id })),
          ...Array.from(listIds).map((id) => ({ type: 'entityList' as const, id })),
        ]
      },
      // list events do not say which entities changed, so refetch everything cached for the project
      async onCacheEntryAdded(
        { projectName, entityType },
        { cacheDataLoaded, cacheEntryRemoved, getCacheEntry, updateCachedData, dispatch },
      ) {
        let token: string | undefined
        const batcher = createRealtimeBatcher<{ projectName: string }>(
          async (_items, isActive) => {
            const entityIds = Object.keys(getCacheEntry().data || {})
            if (!entityIds.length) return
            try {
              await waitForRealtimeJitter()
              const membership = await fetchMembership(dispatch, {
                projectName,
                entityType,
                entityIds,
              })
              if (!isActive()) return
              updateCachedData((draft) => {
                Object.assign(draft, membership)
              })
            } catch (error) {
              console.error('Realtime lists membership update failed', error)
            }
          },
          (item) => item.projectName,
        )

        try {
          await cacheDataLoaded
          token = PubSub.subscribe('entity_list', (_topic: string, message: any) => {
            if (message?.project !== projectName) return
            batcher.add({ projectName })
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
