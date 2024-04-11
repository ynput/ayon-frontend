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
  { projectName, entityType, patch, entityId, entities },
  { dispatch, queryFulfilled },
  method,
) => {
  // patch new data into the cache of a single entities activities
  const patchResult = dispatch(
    ayonApi.util.updateQueryData('getActivity', { projectName, entityId, entityType }, (draft) =>
      updateCache(draft, patch, method === 'delete'),
    ),
  )

  // patch new data into the getActivities cache
  const patchResult2 = dispatch(
    ayonApi.util.updateQueryData('getActivities', { entities }, (draft) =>
      updateCache(draft, patch, method === 'delete'),
    ),
  )

  try {
    await queryFulfilled
  } catch (error) {
    const message = `Could not ${method} task`
    console.error(message, error)
    toast.error(message)
    patchResult.undo()
    patchResult2.undo()
  }
}

const generateInvalidationTags = ({ entityId, data }) => [
  // invalidate getActivity by the activityId (getActivity has many activityIds)
  { type: 'activity', id: data.activityId },
  // invalidate getActivity for the entity (all activities for the entity)
  { type: 'entityActivities', id: entityId },
  // invalidate getActivities query
  { type: 'entitiesActivities', id: entityId },
]

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
      // this triggers a refetch of getKanBan
      invalidatesTags: (result, error, args) => generateInvalidationTags(args),
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
      // this triggers a refetch of getKanBan
      invalidatesTags: (result, error, args) =>
        generateInvalidationTags({ data: { activityId: args.activityId }, ...args }),
    }),
    deleteActivity: build.mutation({
      query: ({ projectName, activityId }) => ({
        url: `/api/projects/${projectName}/activities/${activityId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'delete')
      },
      // this triggers a refetch of getKanBan
      invalidatesTags: (result, error, args) =>
        generateInvalidationTags({ data: { activityId: args.activityId }, ...args }),
    }),
  }),
})

export const {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} = updateActivities
