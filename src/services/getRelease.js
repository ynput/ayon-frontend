import api from '@api'

const getReleases = api.injectEndpoints({
  endpoints: (build) => ({
    getReleases: build.query({
      query: () => ({
        url: '/onboarding/releases',
      }),
      transformResponse: (res) => res.map((r) => r.name),
    }),
  }),
  overrideExisting: true,
})

export const { useGetReleasesQuery } = getReleases
