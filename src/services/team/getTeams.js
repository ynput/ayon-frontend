import { ayonApi } from '../ayon'

const getTeams = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getTeams: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/teams`,
      }),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map(({ name }) => ({ type: 'team', id: name })),
              { type: 'teams', id: 'LIST' },
            ]
          : ['team'],
    }),
  }),
})

export const { useGetTeamsQuery } = getTeams
