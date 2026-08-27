import { teamsApi } from '@shared/api/generated'
import { TEAM_ENUM_TAGS } from '../enums'

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
      invalidatesTags: [TEAM_LIST_TAG, ...TEAM_ENUM_TAGS],
    },
    saveTeam: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
        ...TEAM_ENUM_TAGS,
      ],
    },
    deleteTeam: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
        ...TEAM_ENUM_TAGS,
      ],
    },
    saveTeamMember: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
        ...TEAM_ENUM_TAGS,
      ],
    },
    deleteTeamMember: {
      invalidatesTags: (_result, _error, { teamName }) => [
        TEAM_LIST_TAG,
        { type: 'team', id: teamName },
        ...TEAM_ENUM_TAGS,
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
