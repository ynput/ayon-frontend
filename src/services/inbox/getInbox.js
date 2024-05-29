import { ayonApi } from '../ayon'
import { INBOX_ACTIVITIES, INBOX_HAS_UNREAD, INBOX_UNREAD_COUNT } from './inboxQueries'
import { transformInboxMessages } from './inboxTransform'

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
      }),
      transformResponse: (res, meta, { important, active }) =>
        transformInboxMessages(res?.data?.inbox, {
          important,
          active,
        }),
      // only use active and isActive as cache keys
      serializeQueryArgs: ({ queryArgs: { active, important } }) => ({
        active,
        important,
      }),
      // when we get new data, merge it with the existing cache
      // (pagination)
      merge: (currentCache, newCache) => {
        const { messages = [], projectNames = [], hasPreviousPage, lastCursor } = newCache
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
          hasPreviousPage,
          lastCursor,
        }
      },
      keepUnusedDataFor: 30,
    }),
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
      providesTags: (result, error, { important }) => [{ type: 'inbox', id: `count-${important}` }],
    }),
  }),
})

export const {
  useGetInboxQuery,
  useLazyGetInboxQuery,
  useGetInboxHasUnreadQuery,
  useGetInboxUnreadCountQuery,
} = getInbox
