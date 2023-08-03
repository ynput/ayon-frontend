import { ayonApi } from '../ayon'

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
    }),
    getInstallStatus: build.query({
      query: () => ({
        url: '/api/onboarding/status',
      }),
    }),
  }),
})

export const {
  useInitializeUserMutation,
  useAbortOnBoardingMutation,
  useGetReleasesQuery,
  useGetInstallStatusQuery,
} = onBoarding
