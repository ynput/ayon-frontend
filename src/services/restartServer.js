import PubSub from '../pubsub'
import api from '@api'

const restartServer = api.injectEndpoints({
  endpoints: (build) => ({
    restartServer: build.mutation({
      query: () => ({
        url: '/api/system/restart',
        method: 'POST',
      }),
    }),
    getRestart: build.query({
      query: () => ({
        url: `/api/system/restartRequired`,
        method: 'GET',
      }),
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = async (topic, message) => {
            localStorage.removeItem('restart-snooze')
            updateCachedData((draft) => {
              Object.assign(draft, { reason: message.description, required: true })
            })
          }

          // sub to websocket topic
          token = PubSub.subscribe('server.restart_required', handlePubSub)
        } catch (error) {
          console.error(error)
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    }),

    postRestart: build.mutation({
      query: ({ required, reason }) => ({
        url: `/api/system/restartRequired`,
        method: 'POST',
        body: {
          required,
          reason,
        },
      }),
      async onQueryStarted({ required, reason }, { dispatch, queryFulfilled }) {
        const putResult = dispatch(
          api.util.updateQueryData('getRestart', {}, (draft) => {
            Object.assign(draft, { required, reason })
          }),
        )
        try {
          await queryFulfilled
        } catch {
          putResult.undo()
        }
      },
    }),
  }),
  overrideExisting: true,
})

export const { useRestartServerMutation, usePostRestartMutation, useGetRestartQuery } =
  restartServer
