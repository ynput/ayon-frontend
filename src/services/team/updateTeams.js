import { ayonApi } from '../ayon'

const updateTeams = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateTeam: build.mutation({
      query: ({ projectName, teamName, team }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}`,
        method: 'PUT',
        body: team,
      }),
      invalidatesTags: (result, error, { teamName, disableInvalidate }) =>
        !disableInvalidate ? [{ type: 'team', id: teamName }] : [],
    }),
    deleteTeam: build.mutation({
      query: ({ projectName, teamName }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { teamName, disableInvalidate }) =>
        !disableInvalidate ? [{ type: 'team', id: teamName }] : [],
    }),
    updateTeamMember: build.mutation({
      query: ({ projectName, teamName, memberName, member }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}/members/${memberName}`,
        method: 'PUT',
        body: member,
      }),
      invalidatesTags: (result, error, { teamName }) => [{ type: 'team', id: teamName }],
    }),
    deleteTeamMember: build.mutation({
      query: ({ projectName, teamName, memberName }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}/members/${memberName}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { teamName }) => [{ type: 'team', id: teamName }],
    }),
  }),
})

export const { useUpdateTeamMutation, useUpdateTeamMemberMutation } = updateTeams
