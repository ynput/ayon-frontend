import api from '@api'
import queryUpload from '../queryUpload'
import PubSub from '@/pubsub'

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

const onBoarding = api.injectEndpoints({
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
      invalidatesTags: ['info'],
    }),
    restartOnBoarding: build.mutation({
      query: () => ({
        url: '/api/onboarding/restart',
        method: 'POST',
      }),
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
            overwrite: true,
          })

          // then, upload all dep packages
          const depPackagesPromise = queryUpload({ files: depPackages }, api, {
            endpoint: '/api/desktop/dependencyPackages',
            method: 'post',
            fromUrl: true,
            overwrite: true,
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
      invalidatesTags: [
        'info',
        'bundleList',
        'addonList',
        'addonSettingsList',
        'installerList',
        'dependencyPackage',
      ],
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
      async onCacheEntryAdded({ topics = [], ids = [] }, { updateCachedData, cacheEntryRemoved }) {
        let subscriptions = []
        try {
          const handlePubSub = (topic, message) => {
            if (topic === 'client.connected') {
              return
            }

            // if message is not in ids, ignore
            if (!ids.includes(message.id)) return

            // update cache
            updateCachedData((draft) => {
              // find index of event
              const index = draft.findIndex((e) => e.id === message.id)
              // replace event
              if (index !== -1) {
                draft[index] = message
              } else {
                // add event
                draft.push(message)
              }
            })
          }

          // sub to websocket topics
          topics.forEach((topic) => {
            const sub = PubSub.subscribe(topic, handlePubSub)
            subscriptions.push(sub)
          })
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
  }),
  overrideExisting: true,
})

export const {
  useInitializeUserMutation,
  useAbortOnBoardingMutation,
  useGetInstallStatusQuery,
  useInstallPresetMutation,
  useGetInstallEventsQuery,
  useRestartOnBoardingMutation,
} = onBoarding
