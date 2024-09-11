import api from '@api'
import queryUpload from '../queryUpload'

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
  }),
  overrideExisting: true,
})

export const {
  useInitializeUserMutation,
  useAbortOnBoardingMutation,
  useGetInstallStatusQuery,
  useInstallPresetMutation,
  useRestartOnBoardingMutation,
} = onBoarding
