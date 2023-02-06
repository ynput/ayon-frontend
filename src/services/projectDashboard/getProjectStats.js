import { ayonApi } from '../ayon'

const getProjectStats = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectStats: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/stats`,
      }),
    }),
  }),
})

export const { useGetProjectStatsQuery } = getProjectStats
