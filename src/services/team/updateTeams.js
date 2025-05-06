import api from '@shared/api'

const updateTeams = api.injectEndpoints({
  endpoints: (build) => ({
    updateTeam: build.mutation({
      query: ({ projectName, teamName, team }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}`,
        method: 'PUT',
        body: team,
      }),
      invalidatesTags: (result, error, { teamName, disableInvalidate }) =>
        !disableInvalidate ? [{ type: 'team', id: teamName }] : [],
      async onQueryStarted(
        { teamName, team, optimisticUpdate, projectName },
        { dispatch, queryFulfilled },
      ) {
        if (!optimisticUpdate) return

        const patchResult = dispatch(
          api.util.updateQueryData('getTeams', { projectName, showMembers: true }, (draft) => {
            const notInDraft = draft.every((t) => t.name !== teamName)

            if (notInDraft) {
              // add new team to draft
              draft.push(team)
            } else {
              // update existing team in draft
              draft.forEach((t) => {
                if (t.name === teamName) {
                  Object.assign(t, team)
                }
              })
            }
          }),
        )
        try {
          await queryFulfilled
        } catch (err) {
          patchResult.undo()

          /**
           * Alternatively, on failure you can invalidate the corresponding cache tags
           * to trigger a re-fetch:
           */

          // trigger invalidate
          dispatch(api.util.invalidateTags(['teams']))
        }
      },
    }),
    deleteTeam: build.mutation({
      query: ({ projectName, teamName }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => ['teams'],
      async onQueryStarted({ projectName, teamName }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getTeams', { projectName, showMembers: true }, (draft) => {
            const index = draft.findIndex((t) => t.name === teamName)
            if (index > -1) {
              draft.splice(index, 1)
            }
          }),
        )
        try {
          await queryFulfilled
        } catch (err) {
          patchResult.undo()

          /**
           * Alternatively, on failure you can invalidate the corresponding cache tags
           * to trigger a re-fetch:
           */

          // trigger invalidate
          dispatch(api.util.invalidateTags(['teams']))
        }
      },
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
    updateTeams: build.mutation({
      query: ({ projectName, teams }) => ({
        url: `/api/projects/${projectName}/teams`,
        method: 'PATCH',
        body: teams,
      }),
      invalidatesTags: (result, error, { noInvalidate }) => (!noInvalidate ? ['team'] : []),
      async onQueryStarted({ teams, noOpt, projectName }, { dispatch, queryFulfilled }) {
        if (noOpt) return

        const patchResult = dispatch(
          api.util.updateQueryData('getTeams', { projectName, showMembers: true }, (draft) => {
            teams.forEach((team) => {
              const notInDraft = draft.every((t) => t.name !== team.name)

              // create leaders array
              const leaders = team.members.filter((m) => m.isLeader)
              const newTeam = {
                ...team,
                leaders,
                membersCount: team.members.length - leaders.length,
              }

              if (notInDraft) {
                // add new team to draft
                draft.push(newTeam)
              } else {
                // update existing team in draft
                draft.forEach((t) => {
                  if (t.name === team.name) {
                    Object.assign(t, newTeam)
                  }
                })
              }
            })
          }),
        )
        try {
          await queryFulfilled
        } catch (err) {
          patchResult.undo()

          /**
           * Alternatively, on failure you can invalidate the corresponding cache tags
           * to trigger a re-fetch:
           */

          // trigger invalidate
          dispatch(api.util.invalidateTags(['teams']))
        }
      },
    }),
  }),
  overrideExisting: true,
})

export const {
  useUpdateTeamMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMutation,
  useUpdateTeamsMutation,
} = updateTeams
