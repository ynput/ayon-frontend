import { api } from '@api/rest/activities'
import apiRest from '@api'
import { ActivityNode } from '@api/graphql'

// @ts-ignore
const patchActivity = ({ activityId, userName, reaction }, { getState, dispatch }, action) => {
  const invalidatingTags = [{ type: 'activity', id: activityId }]
  const entries = api.util.selectInvalidatedBy(getState(), invalidatingTags)

  return entries.map((cacheArgs) => {
    return dispatch(
      // @ts-ignore
      apiRest.util.updateQueryData('getActivities', cacheArgs.originalArgs, (draft) => {
        // @ts-ignore
        const index = draft.activities.findIndex((a: ActivityNode) => a.activityId === activityId)
        if (action === 'create') {
          // @ts-ignore
          draft.activities[index].reactions.push({
            reaction,
            userName,
            fullName: '',
            timeStamp: '',
          })
        }

        if (action === 'delete') {
          // @ts-ignore
          for (const idx in draft.activities[index].reactions) {
            // @ts-ignore
            const item = draft.activities[index].reactions[idx]
            if (item.userName == userName && item.reaction == reaction) {
              // @ts-ignore
              draft.activities[index].reactions.splice(idx, 1)
              break
            }
          }
        }
      }),
    )
  })
}
const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    createReactionToActivity: {
      invalidatesTags: (_result, _error, args) => [{ type: 'activity', id: args.activityId }],
      async onQueryStarted(args, { getState, dispatch, queryFulfilled }) {
        const patches = patchActivity(
          {
            activityId: args.activityId,
            // @ts-ignore
            userName: args.userName,
            reaction: args.createReactionModel.reaction,
          },
          { getState, dispatch },
          'create',
        )

        try {
          await queryFulfilled
        } catch {
          for (const patchResult of patches) {
            patchResult.undo()
          }
        }
      },
    },
    deleteReactionToActivity: {
      invalidatesTags: (_result, _error, args) => [{ type: 'activity', id: args.activityId }],
      async onQueryStarted(args, { getState, dispatch, queryFulfilled }) {
        const patches = patchActivity(
          // @ts-ignore
          { activityId: args.activityId, userName: args.userName, reaction: args.reaction },
          { getState, dispatch },
          'delete',
        )

        try {
          await queryFulfilled
        } catch {
          for (const patchResult of patches) {
            patchResult.undo()
          }
        }
      },
    },
  },
})

export const { useCreateReactionToActivityMutation, useDeleteReactionToActivityMutation } =
  enhancedApi
