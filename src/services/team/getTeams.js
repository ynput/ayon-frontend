import api from '@shared/api'

const getTeams = api.injectEndpoints({
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
  overrideExisting: true,
})

export const { useGetTeamsQuery } = getTeams
