import { api } from '@api/rest/activities'
import { ActivityNode } from '@api/graphql'
import { getActivitiesGQLApi } from '@queries/activities/getActivities'

// @ts-ignore
const patchActivity = ({ activityId, userName, reaction }, { getState, dispatch }, action) => {
  const invalidatingTags = [{ type: 'activity', id: activityId }]
  const entries = getActivitiesGQLApi.util.selectInvalidatedBy(getState(), invalidatingTags)

  return entries.map((cacheArgs) => {
    return dispatch(
      // @ts-ignore
      getActivitiesGQLApi.util.updateQueryData(
        'getActivitiesInfinite',
        cacheArgs.originalArgs,
        (draft) => {
          console.log('patchActivity', action, activityId, userName, reaction)

          // Handle paginated structure
          for (const page of draft.pages) {
            const index = page.activities.findIndex(
              (a: ActivityNode) => a.activityId === activityId,
            )
            if (index === -1) continue

            if (action === 'create') {
              page.activities[index].reactions = [
                ...(page.activities[index].reactions || []),
                {
                  reaction,
                  userName,
                  fullName: '',
                  timeStamp: '',
                },
              ]
            }

            if (action === 'delete') {
              for (const idx in page.activities[index].reactions) {
                const item = page.activities[index].reactions[idx]
                if (item.userName == userName && item.reaction == reaction) {
                  page.activities[index].reactions.splice(idx, 1)
                  break
                }
              }
            }

            // Found and updated the activity, no need to check other pages
            return
          }
        },
      ),
    )
  })
}

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    createReactionToActivity: {
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
