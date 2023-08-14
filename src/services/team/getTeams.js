import { ayonApi } from '../ayon'

const getTeams = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getTeams: build.query({
      query: ({ projectName, showMembers = true }) => ({
        url: `/api/projects/${projectName}/teams?show_members=${showMembers}`,
      }),
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map(({ name }) => ({ type: 'team', id: name })),
              { type: 'team', id: 'LIST' },
            ]
          : ['team'],
    }),
  }),
})

export const { useGetTeamsQuery } = getTeams
