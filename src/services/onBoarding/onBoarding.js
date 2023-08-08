import { ayonApi } from '../ayon'
import queryUpload from '../queryUpload'
import PubSub from '/src/pubsub'

const EVENTS_QUERY = `
query InstallEvents($ids: [String!]!) {
  events(last: 100, ids: $ids) {
    edges {
      node {
        id
        status
        description
      }
    }
  }
}
`

const onBoarding = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    initializeUser: build.mutation({
      query: (body) => ({
        url: '/api/onboarding/initialize',
        method: 'POST',
        body,
      }),
    }),
    abortOnBoarding: build.mutation({
      query: () => ({
        url: '/api/onboarding/abort',
        method: 'POST',
      }),
    }),
    getReleases: build.query({
      query: () => ({
        url: '/api/onboarding/releases',
      }),
      transformResponse: (response) => response?.releases || [],
    }),
    getRelease: build.query({
      query: ({ name }) => ({
        url: `/api/onboarding/releases/${name}`,
      }),
      transformResponse: (response) => response || {},
    }),
    getInstallStatus: build.query({
      query: () => ({
        url: '/api/onboarding/status',
      }),
    }),
    installPreset: build.mutation({
      queryFn: async (arg, api) => {
        const { addons = [], installers = [], depPackages = [] } = arg || {}

        try {
          // first, upload all addons
          const addonsPromise = queryUpload({ files: addons }, api, {
            endpoint: '/api/addons/install',
            method: 'post',
            fromUrl: true,
          })

          // then, upload all installers
          const installersPromise = queryUpload({ files: installers }, api, {
            endpoint: '/api/desktop/installers',
            method: 'post',
            fromUrl: true,
          })

          // then, upload all dep packages
          const depPackagesPromise = queryUpload({ files: depPackages }, api, {
            endpoint: '/api/desktop/dependency_packages',
            method: 'post',
            fromUrl: true,
          })

          // wait for all promises to resolve
          const [addonsRes, installersRes, depPackagesRes] = await Promise.all([
            addonsPromise,
            installersPromise,
            depPackagesPromise,
          ])

          // add eventIds to array
          const eventIds = [
            ...(addonsRes.data || []),
            ...(installersRes.data || []),
            ...(depPackagesRes.data || []),
          ]

          return { data: eventIds }
        } catch (error) {
          console.error(error)
          return { error: error?.response?.data?.detail || 'Upload error' }
        }
      },
    }),
    getInstallEvents: build.query({
      query: ({ ids = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_QUERY,
          variables: { ids },
        },
      }),
      transformResponse: (response) => response?.data?.events?.edges?.map(({ node }) => node),
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let token
        try {
          const handlePubSub = (topic, message) => {
            if (topic === 'client.connected') {
              return
            }

            // check id is in the list of ids
            if (!arg.ids.includes(message.id)) return

            // update cache

            updateCachedData((draft) => {
              // find index of event
              const index = draft.findIndex((e) => e.id === message.id)
              // replace event
              if (index !== -1) {
                draft[index] = message
              }
            })
          }

          // sub to websocket topic
          token = PubSub.subscribe('addon.install_from_url', handlePubSub)

          await cacheDataLoaded
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
  }),
})

export const {
  useInitializeUserMutation,
  useAbortOnBoardingMutation,
  useGetReleasesQuery,
  useGetInstallStatusQuery,
  useInstallPresetMutation,
  useGetInstallEventsQuery,
  useGetReleaseQuery,
  useLazyGetReleaseQuery,
} = onBoarding
