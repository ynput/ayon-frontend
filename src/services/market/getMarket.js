import { ayonApi } from '../ayon'
import PubSub from '/src/pubsub'
// import { lt } from 'semver'

const EVENTS_QUERY = `
query DownloadEvents {
  events(last: 100) {
    edges {
      node {
        id
        status
        description
        summary
      }
    }
  }
}
`

const getMarket = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // getMarketAddons
    getMarketAddons: build.query({
      query: () => ({
        url: `/api/market/addons`,
        method: 'GET',
      }),
      providesTags: (addons) =>
        [
          ...(addons?.map(({ id }) => ({ type: 'marketAddon', id })) || []),
          {
            type: 'marketAddon',
            id: 'LIST',
          },
        ] || [],
      transformResponse: (response) =>
        (response?.addons || []).map((addon) => {
          const isDownloaded = !!addon.currentLatestVersion
          const isOfficial = addon.orgName === 'ynput-official'
          // NOTE: isOutdated is now provided directly from the server
          // const isOutdated =
          //   addon.latestVersion &&
          //   addon.currentLatestVersion &&
          //   lt(addon.currentLatestVersion, addon.latestVersion)
          const isProductionOutdated = addon.currentLatestVersion !== addon.currentProductionVersion

          return {
            ...addon,
            isOfficial,
            isDownloaded,
            //isOutdated,
            isProductionOutdated,
            isVerified: false,
          }
        }),
    }),
    // getMarketAddon
    getMarketAddon: build.query({
      query: (id) => ({
        url: `/api/market/addons/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [
        { type: 'marketAddon', id },
        { type: 'marketAddon', id: 'LIST' },
      ],
    }),
    // getMarketAddonVersion
    getMarketAddonVersion: build.query({
      query: ({ id, version }) => ({
        url: `/api/market/addons/${id}/${version}`,
        method: 'GET',
      }),
      providesTags: (result, error, { id }) => [
        { type: 'marketAddon', id },
        { type: 'marketAddon', id: 'LIST' },
      ],
    }),
    getMarketDownloadEvents: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_QUERY,
        },
      }),
      transformResponse: (response) =>
        response?.data?.events?.edges
          ?.map(({ node }) => node)
          .filter((e) => e.status !== 'finished'),
      async onCacheEntryAdded(_args, { updateCachedData, cacheEntryRemoved }) {
        let subscriptions = []
        try {
          const handlePubSub = (topic, message) => {
            if (topic === 'client.connected') {
              return
            }

            // update cache
            updateCachedData((draft) => {
              if (!draft) return (draft = [message])
              // find index of event
              const index = draft?.findIndex((e) => e.id === message.id)
              // replace event
              if (index !== -1) {
                draft[index] = message
              } else {
                // add event
                draft.push(message)
              }
            })
          }

          const sub = PubSub.subscribe('addon.install_from_url', handlePubSub)
          subscriptions.push(sub)
        } catch (error) {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
          console.error(error)
        }
        await cacheEntryRemoved
        // unsubscribe from all topics
        subscriptions.forEach((sub) => PubSub.unsubscribe(sub))
      },
    }),
  }), // endpoints
})

export const {
  useGetMarketAddonsQuery,
  useGetMarketAddonQuery,
  useLazyGetMarketAddonQuery,
  useLazyGetMarketAddonVersionQuery,
  useGetMarketAddonVersionQuery,
  useGetMarketDownloadEventsQuery,
} = getMarket
