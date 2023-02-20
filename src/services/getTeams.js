import { ayonApi } from './ayon'

const getTeams = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getTeams: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/teams`,
      }),
    }),
  }),
})

export const { useGetTeamsQuery } = getTeams
