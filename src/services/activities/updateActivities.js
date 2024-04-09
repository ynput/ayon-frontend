import { ayonApi } from '../ayon'
import { toast } from 'react-toastify'

const updateActivities = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateActivity: build.mutation({
      query: ({ projectName, entityType, entityId, data = {} }) => ({
        url: `/api/projects/${projectName}/${entityType}/${entityId}/activities`,
        method: 'POST',
        // generate a new activityId if this is a new activity
        body: data,
      }),
      async onQueryStarted(
        { projectName, entityType, patch, entityId },
        { dispatch, queryFulfilled },
      ) {
        console.log(projectName, entityType, patch, entityId)

        // patch new data into the cache of a single entities activities
        const patchResult = dispatch(
          ayonApi.util.updateQueryData(
            'getActivity',
            { projectName, entityId, entityType },
            (draft) => {
              const activityIndex = draft.findIndex(
                (activity) => activity.activityId === patch?.activityId,
              )

              // no activity found, add it to the end
              if (activityIndex === -1) {
                // add the new activity to the end of the list
                draft.push(patch)
              }
              // activity found, update it
              else {
                const newActivityData = { ...draft[activityIndex], ...patch }
                // update the activity in the cache by index
                draft[activityIndex] = newActivityData
              }
            },
          ),
        )

        try {
          await queryFulfilled
        } catch (error) {
          console.error('error updating task', error)
          toast.error(error?.error?.data?.detail || 'Failed to update task')
          patchResult.undo()
        }
      },
      // this triggers a refetch of getKanBan
      invalidatesTags: (result, error, { entityId, data }) => [
        // invalidate getActivity by the activityId (getActivity has many activityIds)
        { type: 'activity', id: data.activityId },
        // invalidate getActivity for the entity (all activities for the entity)
        { type: 'entityActivities', id: entityId },
        // invalidate getActivities query
        { type: 'entitiesActivities', id: entityId },
      ],
    }),
  }),
})

export const { useUpdateActivityMutation } = updateActivities
