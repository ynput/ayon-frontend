import { createRealtimeBatcher, PubSub } from '@shared/util'
import { gqlApi } from '@shared/api'
import type {
  GetInboxHasUnreadQuery,
  GetInboxMessagesQuery,
  GetInboxUnreadCountQuery,
} from '@shared/api'
import { TagTypesFromApi } from '@reduxjs/toolkit/query'
import {
  TransformedInboxMessages,
  mergeInboxMessages,
  transformInboxMessages,
} from './inboxTransform'
import { DefinitionsFromApi, OverrideResultType } from '@reduxjs/toolkit/query'

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>

type UpdatedDefinitions = Omit<
  Definitions,
  'GetInboxMessages' | 'GetInboxUnreadCount' | 'GetInboxHasUnread'
> & {
  GetInboxMessages: OverrideResultType<Definitions['GetInboxMessages'], TransformedInboxMessages>
  GetInboxUnreadCount: OverrideResultType<Definitions['GetInboxUnreadCount'], number>
  GetInboxHasUnread: OverrideResultType<Definitions['GetInboxHasUnread'], boolean>
}

export const enhancedInboxGraphql = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetInboxMessages: {
      transformResponse: (res: GetInboxMessagesQuery, _meta, args) =>
        transformInboxMessages(res.inbox, args),
      // cursor and page size must not key the cache, everything else must:
      // unread and unfiltered results would otherwise share one entry
      serializeQueryArgs: ({ queryArgs: { active, important, unread } = {} }) => ({
        active,
        important,
        unread,
      }),
      // when we get new data, merge it with the existing cache
      // (pagination)
      merge: mergeInboxMessages,
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
        const batcher = createRealtimeBatcher(
          (messages: { isImportant?: boolean }[]) => {
            if (messages.some(({ isImportant }) => isImportant)) {
              updateCachedData(() => true)
            }

            const importanceValues = [...new Set(messages.map(({ isImportant }) => isImportant))]
            dispatch(
              gqlApi.util.invalidateTags(
                importanceValues.flatMap((isImportant) => [
                  { type: 'inbox', id: `important=${isImportant}` },
                  { type: 'inbox', id: `count-${isImportant}` },
                ]),
              ),
            )
          },
          ({ isImportant }) => String(isImportant),
        )
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (_topic: string, message: any) => {
            batcher.add({ isImportant: message?.summary?.isImportant })
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
        batcher.clear()
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
