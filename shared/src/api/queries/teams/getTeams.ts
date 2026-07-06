import { teamsApi } from '@shared/api/generated'

const TEAM_LIST_TAG = { type: 'team' as const, id: 'LIST' }

const enhancedTeamsApi = teamsApi.enhanceEndpoints({
  endpoints: {
    getTeams: {
      providesTags: (result) =>
        result
          ? [TEAM_LIST_TAG, ...result.map((team) => ({ type: 'team' as const, id: team.name }))]
          : [TEAM_LIST_TAG],
    },
    updateTeams: {
      invalidatesTags: [TEAM_LIST_TAG],
    },
    saveTeam: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
      ],
    },
    deleteTeam: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
      ],
    },
    saveTeamMember: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
      ],
    },
    deleteTeamMember: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
      ],
    },
  },
})

export const {
  useGetTeamsQuery,
  useUpdateTeamsMutation,
  useSaveTeamMutation,
  useDeleteTeamMutation,
  useSaveTeamMemberMutation,
  useDeleteTeamMemberMutation,
} = enhancedTeamsApi
export { enhancedTeamsApi as teamsQueries }
