import { ayonApi } from './ayon'

const getProjectDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectDashboard: build.query({
      query: ({ projectName, panel }) => ({
        url: `project/${projectName}/dashboard/${panel}`,
      }),
    }),
  }),
})

export const { useGetProjectDashboardQuery } = getProjectDashboard
