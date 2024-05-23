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
      transformResponse: (res, err, { isCleared }) =>
        transformInboxMessages(res?.data?.projects?.edges, isCleared),
    }),
  }),
})

export const { useGetInboxQuery } = getInbox
