import { ayonApi } from './ayon'

const getReleases = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getReleases: build.query({
      query: () => ({
        url: '/onboarding/releases',
      }),
      transformResponse: (res) => res.map((r) => r.name),
    }),
  }),
})

export const { useGetReleasesQuery } = getReleases
