import { ayonApi } from '../ayon'
import { toast } from 'react-toastify'

const updateCache = (draft, patch = {}, isDelete) => {
  // find the index of the activity to update
  const index = draft.findIndex((a) => a.activityId === patch.activityId)
  if (index === -1) {
    // add to the end of the list
    draft.push(patch)
  } else if (isDelete) {
    draft.splice(index, 1)
  } else {
    // update the activity
    draft[index] = { ...draft[index], ...patch }
  }
}

const patchActivities = async (
  { projectName, patch, entityIds, activityTypes = [] },
  { dispatch, queryFulfilled },
  method,
) => {
  // patch new data into the cache of a single entities activities
  const patchResult = dispatch(
    ayonApi.util.updateQueryData(
      'getActivities',
      { projectName, entityIds, activityTypes },
      (draft) => updateCache(draft, patch, method === 'delete'),
    ),
  )

  try {
    await queryFulfilled
  } catch (error) {
    const message = `Could not ${method} task`
    console.error(message, error)
    toast.error(message)
    patchResult.undo()
  }
}

const updateActivities = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    createEntityActivity: build.mutation({
      query: ({ projectName, entityType, entityId, data = {} }) => ({
        url: `/api/projects/${projectName}/${entityType}/${entityId}/activities`,
        method: 'POST',
        // generate a new activityId if this is a new activity
        body: data,
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'create')
      },
    }),

    updateActivity: build.mutation({
      query: ({ projectName, activityId, data }) => ({
        url: `/api/projects/${projectName}/activities/${activityId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'update')
      },
    }),
    deleteActivity: build.mutation({
      query: ({ projectName, activityId }) => ({
        url: `/api/projects/${projectName}/activities/${activityId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'delete')
      },
    }),
  }),
})

export const {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} = updateActivities
