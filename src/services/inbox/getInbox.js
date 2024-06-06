import { ayonApi } from '../ayon'
import { INBOX_ACTIVITIES, INBOX_HAS_UNREAD, INBOX_UNREAD_COUNT } from './inboxQueries'
import { transformInboxMessages } from './inboxTransform'
import PubSub from '/src/pubsub'

const getInbox = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // get multiple entities activities
    getInbox: build.query({
      query: ({ last = 50, active = null, important = null, cursor = undefined }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: INBOX_ACTIVITIES,
          variables: { last, active, important, cursor },
        },
        validateStatus: (response, result) => response.status === 200 && !result?.errors?.length,
      }),
      transformResponse: (res, meta, { important }) =>
        transformInboxMessages(res?.data?.inbox, {
          important,
        }),
      transformErrorResponse: (error) => error?.data?.errors?.[0]?.message,

      // only use active and isActive as cache keys
      serializeQueryArgs: ({ queryArgs: { active, important } }) => ({
        active,
        important,
      }),
      // when we get new data, merge it with the existing cache
      // (pagination)
      merge: (currentCache, newCache) => {
        const { messages = [], projectNames = [], pageInfo } = newCache
        const { messages: lastMessages = [], projectNames: lastProjectNames = [] } = currentCache

        const newMessages = [
          ...lastMessages,
          ...messages.filter((m) => !lastMessages.some((lm) => lm.referenceId === m.referenceId)),
        ]
        const newProjectNames = [
          ...lastProjectNames,
          ...projectNames.filter((p) => !lastProjectNames.includes(p)),
        ]

        return {
          messages: newMessages,
          projectNames: newProjectNames,
          pageInfo,
        }
      },
      keepUnusedDataFor: 30,
      providesTags: (res, error, { active, important }) => [
        { type: 'inbox', id: 'LIST' },
        { type: 'inbox', id: `important=${important}` },
        { type: 'inbox', id: `active=${active}/important=${important}` },
      ],
    }),
    // are any important messages unread, this is the little red dot
    getInboxHasUnread: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: INBOX_HAS_UNREAD,
        },
      }),
      transformResponse: (res) => !!res?.data?.inbox?.edges.length,
      providesTags: () => [{ type: 'inbox', id: 'hasUnread' }],
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic, message) => {
            if (topic !== 'inbox.message') return
            const isImportant = message?.summary?.isImportant

            if (isImportant) {
              // set unread to true
              updateCachedData(() => true)
            }

            // invalidate the getInbox cache
            // invalidate the getInboxUnreadCount cache
            dispatch(
              ayonApi.util.invalidateTags([
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
    }),
    getInboxUnreadCount: build.query({
      query: ({ important }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: INBOX_UNREAD_COUNT,
          variables: { important },
        },
      }),
      transformResponse: (res) => res?.data?.inbox?.edges.length,
      providesTags: (result, error, { important }) => [
        { type: 'inbox', id: 'unreadCount' },
        { type: 'inbox', id: `count-${important}` },
      ],
    }),
  }),
})

export const {
  useGetInboxQuery,
  useLazyGetInboxQuery,
  useGetInboxHasUnreadQuery,
  useGetInboxUnreadCountQuery,
} = getInbox
