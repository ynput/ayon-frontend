// @ts-ignore
import PubSub from '@/pubsub'
import API from '@api'
import { ayonApi } from '../ayon'
import { $Any } from '@types'
import {
  GetInboxHasUnreadQuery,
  GetInboxMessagesQuery,
  GetInboxUnreadCountQuery,
} from '@api/graphql'
import { TagTypesFromApi } from '@reduxjs/toolkit/query'
import { TransformedInboxMessages, transformInboxMessages } from './inboxTransform'
import { DefinitionsFromApi, OverrideResultType } from '@reduxjs/toolkit/query'

type Definitions = DefinitionsFromApi<typeof API.graphql>
type TagTypes = TagTypesFromApi<typeof API.graphql>

type UpdatedDefinitions = Omit<
  Definitions,
  'GetInboxMessages' | 'GetInboxUnreadCount' | 'GetInboxHasUnread'
> & {
  GetInboxMessages: OverrideResultType<Definitions['GetInboxMessages'], TransformedInboxMessages>
  GetInboxUnreadCount: OverrideResultType<Definitions['GetInboxUnreadCount'], number>
  GetInboxHasUnread: OverrideResultType<Definitions['GetInboxHasUnread'], boolean>
}

export const enhancedInboxGraphql = API.graphql.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetInboxMessages: {
      transformResponse: (res: GetInboxMessagesQuery, _meta, args) =>
        transformInboxMessages(res.inbox, args),
      transformErrorResponse: (error) => error.message,

      // only use active and isActive as cache keys
      serializeQueryArgs: ({ queryArgs: { active, important } = {} }) => ({
        active,
        important,
      }),
      // when we get new data, merge it with the existing cache
      // (pagination)
      merge: (currentCache: TransformedInboxMessages, newCache: TransformedInboxMessages) => {
        const { messages = [], projectNames = [], pageInfo } = newCache
        const { messages: lastMessages = [], projectNames: lastProjectNames = [] } = currentCache

        type Message = TransformedInboxMessages['messages'][0]

        const newMessages = [
          ...lastMessages,
          ...messages.filter(
            (m: Message) => !lastMessages.some((lm: Message) => lm.referenceId === m.referenceId),
          ),
        ]
        const newProjectNames = [
          ...lastProjectNames,
          ...projectNames.filter((p: string) => !lastProjectNames.includes(p)),
        ]

        return {
          messages: newMessages,
          projectNames: newProjectNames,
          pageInfo,
        }
      },
      keepUnusedDataFor: 30,
      providesTags: (_res, _error, { active, important } = {}) => [
        { type: 'inbox', id: 'LIST' },
        { type: 'inbox', id: `important=${important}` },
        { type: 'inbox', id: `active=${active}/important=${important}` },
      ],
      async onQueryStarted(arg, { queryFulfilled, getCacheEntry, dispatch }) {
        try {
          const oldCache = getCacheEntry()

          // if it's the first query, do nothing
          if (!oldCache?.data?.messages) return
          // wait for the initial query to resolve before proceeding
          const newCache = await queryFulfilled

          const oldMessages = oldCache?.data?.messages || []
          const newCacheMessages = newCache.data.messages || []

          // find the new messages
          const newMessages = newCacheMessages.filter(
            (m) => !oldMessages.some((lm) => lm.referenceId === m.referenceId),
          )

          // find new message entityIds
          const entityIds = [...new Set(newMessages.map((m) => m.entityId))].filter(
            (id) => !!id,
          ) as string[]

          // invalidate the activity feed for all those entities
          dispatch(
            ayonApi.util.invalidateTags(
              entityIds.map((entityId) => ({ type: 'entityActivities', id: entityId })),
            ),
          )

          console.log(entityIds)
        } catch (error) {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
          console.error(error)
        }
      },
    },
    GetInboxHasUnread: {
      transformResponse: (res: GetInboxHasUnreadQuery) => !!res.inbox.edges.length,
      serializeQueryArgs: () => ({}),
      providesTags: () => [{ type: 'inbox', id: 'hasUnread' }],
      async onCacheEntryAdded(
        _args,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: $Any) => {
            if (topic !== 'inbox.message') return
            const isImportant = message?.summary?.isImportant
            if (isImportant) {
              // set unread to true
              updateCachedData(() => true)
            }

            // invalidate the getInbox cache
            // invalidate the getInboxUnreadCount cache
            dispatch(
              API.graphql.util.invalidateTags([
                { type: 'inbox', id: `important=${isImportant}` },
                { type: 'inbox', id: `count-${isImportant}` },
              ]),
            )
            dispatch(
              API.rest.util.invalidateTags([
                { type: 'inbox', id: `important=${isImportant}` },
                { type: 'inbox', id: `count-${isImportant}` },
              ]),
            )
          }

          // sub to websocket topic
          token = PubSub.subscribe('inbox.message', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    },
    GetInboxUnreadCount: {
      transformResponse: (res: GetInboxUnreadCountQuery): number => res.inbox.edges.length,
      providesTags: (_res, _error, { important } = {}) => [
        { type: 'inbox', id: `count-${important}` },
        { type: 'inbox', id: 'unreadCount' },
      ],
    },
  },
})

export const {
  useGetInboxUnreadCountQuery,
  useGetInboxHasUnreadQuery,
  useGetInboxMessagesQuery,
  useLazyGetInboxMessagesQuery,
} = enhancedInboxGraphql
