import { entityListsApi, gqlApi } from '@shared/api/generated'
import {
  FetchBaseQueryError,
  DefinitionsFromApi,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import type {
  EntityList,
  GetListItemsQuery,
  GetListItemsQueryVariables,
  GetListsItemsForReviewSessionQuery,
  GetListsItemsForReviewSessionResult,
  GetListsQuery,
  GetListsQueryVariables,
} from '@shared/api'
import { parseJSONField } from '../overview'
import {
  createRealtimeBatcher,
  PubSub,
  subscribeToThumbnailUpdates,
  ThumbnailUpdateMessage,
} from '@shared/util'
import {
  GetListItemsResult,
  GetListsResult,
  ListItemMessage,
  ListItemsPageParam,
  ListsPageParam,
} from './types'

const CACHE_TIME = 10 // seconds

// Helper function to safely parse entity list data field from JSON string to object
const parseJSON = (data: string | null | undefined): Record<string, any> => {
  if (!data) return {}

  try {
    if (typeof data !== 'string') {
      return (data as unknown as Record<string, any>) ?? {}
    }
    return JSON.parse(data)
  } catch (e) {
    console.warn('Failed to parse entity list data field:', e, data)
    return {}
  }
}

// GRAPHQL API (getLists and getListItems)
// Define the LISTS_PER_PAGE constant for pagination
export const LISTS_PER_PAGE = 10000
export const LIST_ITEMS_PER_PAGE = 100

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetLists' | 'GetListItems'> & {
  GetLists: OverrideResultType<Definitions['GetLists'], GetListsResult>
  GetListItems: OverrideResultType<Definitions['GetListItems'], GetListItemsResult>
  GetListsItemsForReviewSession: OverrideResultType<
    Definitions['GetListsItemsForReviewSession'],
    GetListsItemsForReviewSessionResult
  >
}

const getListsGqlApiEnhanced = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetLists: {
      transformResponse: (response: GetListsQuery): GetListsResult => {
        return {
          // @ts-expect-error - entityType is string
          lists: response.project.entityLists.edges.map((edge) => ({
            ...edge.node,
            data: parseJSON(edge.node.data),
            attrib: parseJSON(edge.node.allAttrib),
          })),
          pageInfo: response.project.entityLists.pageInfo,
        }
      },
      keepUnusedDataFor: CACHE_TIME,
    },
    GetListItems: {
      transformResponse: (response: GetListItemsQuery): GetListItemsResult => {
        const firstEdge = response.project.entityLists.edges[0]
        if (!firstEdge) {
          throw new Error('List does not exist, was it deleted?')
        }
        return {
          items: response.project.entityLists.edges.flatMap((listEdge) =>
            listEdge.node.items.edges.map(({ node, ...edge }) => {
              return {
                ...node,
                ...edge,
                attrib: parseJSONField(edge.allAttrib),
              } as GetListItemsResult['items'][number]
            }),
          ),
          pageInfo: firstEdge.node.items.pageInfo,
        }
      },
      keepUnusedDataFor: CACHE_TIME,
    },
    GetListsItemsForReviewSession: {
      transformResponse: (
        response: GetListsItemsForReviewSessionQuery,
      ): GetListsItemsForReviewSessionResult => {
        return {
          lists: response.project.entityLists.edges.map((edge) => edge.node),
          pageInfo: response.project.entityLists.pageInfo,
        }
      },
      keepUnusedDataFor: CACHE_TIME,
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

          if (result.error) {
            // Preserve original error (e.g. 403) so the UI can react accordingly
            return { error: result.error as FetchBaseQueryError }
          }

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
      providesTags: (result) => {
        const lists = result?.pages.flatMap((page) => page.lists) || []
        return [
          { type: 'entityList', id: 'LIST' },
          ...lists.flatMap((list) => [
            { type: 'entityList' as const, id: list.id },
            { type: 'entityList' as const, id: list.entityListType },
            { type: 'entityList' as const, id: list.entityListFolderId || 'NO_FOLDER' },
          ]),
        ]
      },
      async onCacheEntryAdded(
        { projectName },
        { cacheDataLoaded, cacheEntryRemoved, updateCachedData },
      ) {
        const topics = new Set([
          'entity_list.changed',
          'entity_list.created',
          'entity_list.deleted',
        ])
        let token: any

        const batcher = createRealtimeBatcher(
          (batch: { topic: string; message: ListItemMessage }[]) => {
            updateCachedData((draft: any) => {
              batch.forEach(({ topic, message }) => {
                const summary = message.summary
                const id = summary.id
                if (!id) return

                const getListFromSummary = (list?: EntityList): EntityList => {
                  return {
                    projectName: projectName,
                    tags: [],
                    data: {},
                    allAttrib: '',
                    attrib: {},
                    createdAt: new Date().toISOString(),
                    updatedAt: '',
                    active: true,
                    access: '',
                    accessLevel: 30,
                    ...(list || {}),
                    id: summary.id as string,
                    label: summary.label,
                    entityType: summary.entity_type,
                    entityListType: summary.entity_list_type,
                    count: summary.count,
                    entityListFolderId: summary.entity_list_folder_id ?? null,
                    updatedBy: message.createdAt, // estimate the event creation time is about the same as list updated at
                    owner: list?.owner || '', // mainly to shut up typescript
                  }
                }

                if (topic === 'entity_list.changed') {
                  const list = draft.pages
                    .flatMap((page: any) => page.lists)
                    .find((item: any) => item.id === id)
                  if (!list) return
                  Object.assign(list, getListFromSummary(list))
                } else if (topic === 'entity_list.created') {
                  if (draft.pages.length !== 0) {
                    draft.pages[0].lists.unshift(getListFromSummary())
                  }
                } else if (topic === 'entity_list.deleted') {
                  draft.pages.forEach((page: any) => {
                    page.lists = page.lists.filter((item: any) => item.id !== id)
                  })
                }
              })
            })
          },
          ({ topic, message }) => `${topic}:${message.summary?.id ?? ''}`,
        )
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: ListItemMessage) => {
            if (!topics.has(topic) || !message?.summary?.id) return
            batcher.add({ topic, message })
          }

          token = PubSub.subscribe('entity_list', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
        batcher.clear()
      },
      keepUnusedDataFor: CACHE_TIME,
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
          // ascending paginates via hasNextPage, descending (last/before) via
          // hasPreviousPage — the backend only sets one depending on direction
          const hasMore = pageInfo.hasNextPage || pageInfo.hasPreviousPage
          if (!hasMore || !pageInfo.endCursor) return undefined

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
            first: LIST_ITEMS_PER_PAGE,
            after: cursor || undefined,
          }

          // Add cursor-based pagination
          queryParams.after = cursor || undefined
          queryParams.first = LIST_ITEMS_PER_PAGE

          if (sortBy) {
            queryParams.sortBy = sortBy
            if (desc) {
              queryParams.before = cursor || undefined
              queryParams.after = undefined
              queryParams.last = LIST_ITEMS_PER_PAGE
              queryParams.first = undefined
            }
          }

          // Call the existing GetLists endpoint
          const result = await api.dispatch(
            getListsGqlApiEnhanced.endpoints.GetListItems.initiate(queryParams, {
              forceRefetch: true,
            }),
          )

          if (result.error) {
            return { error: result.error as FetchBaseQueryError }
          }

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
      async onCacheEntryAdded(
        _args,
        { cacheDataLoaded, cacheEntryRemoved, dispatch, updateCachedData },
      ) {
        let token, token2
        const batcher = createRealtimeBatcher(
          (items: { id: string }[]) => {
            dispatch(
              gqlApi.util.invalidateTags(items.map(({ id }) => ({ type: 'entityListItem', id }))),
            )
          },
          ({ id }) => id,
        )
        let unsubscribeThumbnails: (() => void) | undefined
        try {
          // wait for the initial query to resolve before proceeding
          const cache = await cacheDataLoaded
          const pages = cache.data.pages
          const items = pages.flatMap((page) => page.items)
          // get entityType of first item
          const entityType = items[0]?.entityType

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              updateCachedData((draft: any) => {
                if (!draft?.pages) return
                messages.forEach((message) => {
                  draft.pages.forEach((page: any) => {
                    const pageItems = page.items || []
                    pageItems.forEach((item: any) => {
                      if (
                        item.entityId === message.summary.entityId &&
                        item.entityType === message.summary.entityType &&
                        message.summary.thumbnailHash
                      ) {
                        item.thumbnailHash = message.summary.thumbnailHash
                      }
                    })
                  })
                })
              })
            },
          )

          const listTopic = `entity_list.changed`
          const entityTypeTopic = `entity.${entityType}`

          const handleListMessage = (topic: string, message: ListItemMessage) => {
            if (topic !== listTopic) return
            const summary = message.summary
            const id = summary.id
            if (!id) return
            batcher.add({ id })
          }

          const handleEntityMessage = (topic: string, message: ListItemMessage) => {
            if (!topic.startsWith(entityTypeTopic)) return
            const summary = message.summary
            const id = summary.entityId
            // check for id
            if (!id) return
            batcher.add({ id })
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
        if (unsubscribeThumbnails) {
          unsubscribeThumbnails()
        }
        batcher.clear()
      },
      keepUnusedDataFor: CACHE_TIME,
    }),
    getListsItemsForReviewSession: build.infiniteQuery<
      GetListsItemsForReviewSessionResult,
      Omit<GetListsQueryVariables, 'first' | 'after' | 'before' | 'filter'>,
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
            getListsGqlApiEnhanced.endpoints.GetListsItemsForReviewSession.initiate(queryParams, {
              forceRefetch: true,
            }),
          )

          if (result.error) {
            return { error: result.error as FetchBaseQueryError }
          }

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
      keepUnusedDataFor: CACHE_TIME,
    }),
  }),
})

export const getListsApiEnhanced = entityListsApi.enhanceEndpoints({
  endpoints: {
    getEntityList: {
      providesTags: (result, _e, { listId, projectName }) => [
        { type: 'entityList', id: listId },
        { type: 'entityList', id: projectName },
        ...(result
          ? [
              { type: 'entityList', id: result.entityListType },
              {
                type: 'entityList',
                id: result.entityListFolderId || 'NO_FOLDER',
              },
            ]
          : []),
      ],
      keepUnusedDataFor: CACHE_TIME,
    },
  },
})

export default getListsGqlApiInjected

export const {
  useGetListsInfiniteInfiniteQuery,
  useGetListItemsInfiniteInfiniteQuery,
  useGetListsItemsForReviewSessionInfiniteQuery,
  useLazyGetListsItemsForReviewSessionQuery,
  useLazyGetListItemsQuery,
} = getListsGqlApiInjected

export const { useGetEntityListQuery } = getListsApiEnhanced
