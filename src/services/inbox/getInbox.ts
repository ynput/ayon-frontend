// @ts-ignore
import PubSub from '@/pubsub'
import api from '@shared/api'
import { $Any } from '@types'
import {
  GetInboxHasUnreadQuery,
  GetInboxMessagesQuery,
  GetInboxUnreadCountQuery,
} from '@shared/api'
import { TagTypesFromApi } from '@reduxjs/toolkit/query'
import { TransformedInboxMessages, transformInboxMessages } from './inboxTransform'
import { DefinitionsFromApi, OverrideResultType } from '@reduxjs/toolkit/query'

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>

type UpdatedDefinitions = Omit<
  Definitions,
  'GetInboxMessages' | 'GetInboxUnreadCount' | 'GetInboxHasUnread'
> & {
  GetInboxMessages: OverrideResultType<Definitions['GetInboxMessages'], TransformedInboxMessages>
  GetInboxUnreadCount: OverrideResultType<Definitions['GetInboxUnreadCount'], number>
  GetInboxHasUnread: OverrideResultType<Definitions['GetInboxHasUnread'], boolean>
}

export const enhancedInboxGraphql = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetInboxMessages: {
      transformResponse: (res: GetInboxMessagesQuery, _meta, args) =>
        transformInboxMessages(res.inbox, args),
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
              api.util.invalidateTags([
                { type: 'inbox', id: `important=${isImportant}` },
                { type: 'inbox', id: `count-${isImportant}` },
              ]),
            )
            dispatch(
              api.util.invalidateTags([
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
