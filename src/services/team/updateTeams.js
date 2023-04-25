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
      async onQueryStarted(
        { teamName, team, optimisticUpdate, projectName },
        { dispatch, queryFulfilled },
      ) {
        if (!optimisticUpdate) return

        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getTeams', { projectName, showMembers: true }, (draft) => {
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
          dispatch(ayonApi.util.invalidateTags(['teams']))
        }
      },
    }),
    deleteTeam: build.mutation({
      query: ({ projectName, teamName }) => ({
        url: `/api/projects/${projectName}/teams/${teamName}`,
        method: 'DELETE',
      }),
      invalidatesTags: () => ['teams'],
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

export const { useUpdateTeamMutation, useUpdateTeamMemberMutation, useDeleteTeamMutation } =
  updateTeams
