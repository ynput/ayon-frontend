import { ayonApi } from '../ayon'
import { INBOX_ACTIVITIES } from './inboxQueries'
import { transformInboxMessages } from './inboxTransform'

const getInbox = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // get multiple entities activities
    getInbox: build.query({
      query: ({ last, activityTypes }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: INBOX_ACTIVITIES,
          variables: { last, activityTypes },
        },
      }),
      transformResponse: (res, err, { isCleared, userName }) =>
        transformInboxMessages(res?.data?.projects?.edges, isCleared, userName),
      // only use activityTypes and isCleared as cache keys
      serializeQueryArgs: ({ queryArgs: { last, activityTypes } }) => ({ last, activityTypes }),
    }),
  }),
})

export const { useGetInboxQuery } = getInbox
