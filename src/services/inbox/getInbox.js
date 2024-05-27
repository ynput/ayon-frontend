import { ayonApi } from '../ayon'
import { INBOX_ACTIVITIES } from './inboxQueries'
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
      transformResponse: (res, meta, { important }) =>
        transformInboxMessages(res?.data?.inbox?.edges, important),
      // only use active and isActive as cache keys
      serializeQueryArgs: ({ queryArgs: { last, active, important } }) => ({
        last,
        active,
        important,
      }),
    }),
  }),
})

export const { useGetInboxQuery, useLazyGetInboxQuery } = getInbox
