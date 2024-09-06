import { api } from '@api/rest/releases'

const releasesApi = api.enhanceEndpoints({
  endpoints: {
    getReleases: {},
    getReleaseInfo: {},
  },
})

export const { useGetReleasesQuery, useGetReleaseInfoQuery, useLazyGetReleaseInfoQuery } =
  releasesApi
