import { ayonApi } from '../ayon'
import { INBOX_ACTIVITIES, INBOX_HAS_UNREAD, INBOX_UNREAD_COUNT } from './inboxQueries'
import { transformInboxMessages } from './inboxTransform'

const getInbox = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // get multiple entities activities
    getInbox: build.query({
      query: ({ last = 50, active = null, important = null }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: INBOX_ACTIVITIES,
          variables: { last, active, important },
        },
      }),
      transformResponse: (res, meta, { important, active }) =>
        transformInboxMessages(res?.data?.inbox?.edges, { important, active }),
      // only use active and isActive as cache keys
      serializeQueryArgs: ({ queryArgs: { last, active, important } }) => ({
        last,
        active,
        important,
      }),
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
