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
        validateStatus: (response, result) => response.status === 200 && !result?.errors?.length,
      }),
      transformResponse: (res, meta, { important }) =>
        transformInboxMessages(res?.data?.inbox, {
          important,
        }),
      transformErrorResponse: (error) => error?.data?.errors?.[0]?.message,

      // only use active and isActive as cache keys
      serializeQueryArgs: ({ queryArgs: { active, important, key } }) => ({
        active,
        important,
        key,
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
        { type: 'inbox', id: `active=${active}/important=${important}` },
      ],
    }),
    getInboxHasUnread: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: INBOX_HAS_UNREAD,
        },
      }),
      transformResponse: (res) => [
        !!res?.data?.inbox?.edges.length,
        res?.data?.inbox?.edges[0] && res?.data?.inbox?.edges[0].node?.referenceId,
      ],
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
