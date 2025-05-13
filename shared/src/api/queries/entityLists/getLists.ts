import { gqlApi } from '@shared/api/generated'
import {
  FetchBaseQueryError,
  DefinitionsFromApi,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import type {
  GetListItemsQuery,
  GetListItemsQueryVariables,
  GetListsQuery,
  GetListsQueryVariables,
} from '@shared/api'
import { parseAllAttribs } from '../overview'
import { PubSub } from '@shared/util'
import {
  GetListItemsResult,
  GetListsResult,
  ListItemMessage,
  ListItemsPageParam,
  ListsPageParam,
} from './types'

// GRAPHQL API (getLists and getListItems)
// Define the LISTS_PER_PAGE constant for pagination
export const LISTS_PER_PAGE = 100

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
          // @ts-expect-error - entityType is string
          lists: response.project.entityLists.edges.map((edge) => edge.node),
          pageInfo: response.project.entityLists.pageInfo,
        }
      },
    },
    GetListItems: {
      transformResponse: (response: GetListItemsQuery): GetListItemsResult => {
        return {
          items: response.project.entityLists.edges.flatMap((listEdge) =>
            listEdge.node.items.edges.map(({ node, ...edge }) => {
              return {
                ...node,
                ...edge,
                attrib: parseAllAttribs(edge.allAttrib),
              } as GetListItemsResult['items'][number]
            }),
          ),
          pageInfo: response.project.entityLists.edges[0].node.items.pageInfo,
        }
      },
    },
  },
})

const getListsGqlApiInjected = getListsGqlApiEnhanced.injectEndpoints({
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
      async onCacheEntryAdded(
        _args,
        { cacheDataLoaded, cacheEntryRemoved, dispatch, updateCachedData },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: ListItemMessage) => {
            if (topic !== 'entity_list.changed') return
            const summary = message.summary
            const id = summary.id
            if (!id) return

            // We have all the data we need to update the cache
            updateCachedData((draft) => {
              const list = draft.pages.flatMap((page) => page.lists).find((l) => l.id === id)
              if (!list) return
              const newList = {
                ...list,
                label: summary.label,
                entityType: summary.entity_type,
                entityListType: summary.entity_list_type,
                count: summary.count,
              }

              Object.assign(list, newList)
            })
            // NOTE: We have to invalidate here as we don't know if other fields are updated not included in the updateCachedData
            // invalidates lists list cache
            dispatch(gqlApi.util.invalidateTags([{ type: 'entityList', id: `LIST` }]))
          }

          // sub to websocket topic
          token = PubSub.subscribe('entity_list.changed', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    }),
    getListItemsInfinite: build.infiniteQuery<
      GetListItemsResult,
      Omit<GetListItemsQueryVariables, 'first' | 'after' | 'before' | 'last'> & { desc?: boolean },
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
          const { sortBy, desc, ...rest } = queryArg
          const { cursor } = pageParam

          // Build the query parameters for GetLists
          const queryParams: GetListItemsQueryVariables = {
            ...rest,
            first: LISTS_PER_PAGE,
            after: cursor || undefined,
          }

          // Add cursor-based pagination
          queryParams.after = cursor || undefined
          queryParams.first = LISTS_PER_PAGE

          if (sortBy) {
            queryParams.sortBy = sortBy
            if (desc) {
              queryParams.before = cursor || undefined
              queryParams.after = undefined
              queryParams.last = LISTS_PER_PAGE
              queryParams.first = undefined
            }
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
      async onCacheEntryAdded(_args, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        let token, token2
        try {
          // wait for the initial query to resolve before proceeding
          const cache = await cacheDataLoaded
          const pages = cache.data.pages
          const items = pages.flatMap((page) => page.items)
          // get entityType of first item
          const entityType = items[0]?.entityType

          const listTopic = `entity_list.changed`
          const entityTypeTopic = `entity.${entityType}`

          const invalidateListItems = (id: string) => {
            dispatch(gqlApi.util.invalidateTags([{ type: 'entityListItem', id: id }]))
          }

          const handleListMessage = (topic: string, message: ListItemMessage) => {
            if (topic !== listTopic) return
            const summary = message.summary
            const id = summary.id
            if (!id) return
            invalidateListItems(id)
          }

          const handleEntityMessage = (topic: string, message: ListItemMessage) => {
            if (!topic.startsWith(entityTypeTopic)) return
            const summary = message.summary
            const id = summary.entityId
            // check for id
            if (!id) return
            invalidateListItems(id)
          }

          // sub to websocket topic
          token = PubSub.subscribe(listTopic, handleListMessage)
          if (entityType) token2 = PubSub.subscribe(entityTypeTopic, handleEntityMessage)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
        PubSub.unsubscribe(token2)
      },
    }),
  }),
})

export default getListsGqlApiInjected

export const {
  useGetListsInfiniteInfiniteQuery,
  useGetListItemsInfiniteInfiniteQuery,
  useLazyGetListItemsQuery,
} = getListsGqlApiInjected
