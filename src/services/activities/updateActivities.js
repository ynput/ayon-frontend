import api from '@api'
import { toast } from 'react-toastify'
import { filterActivityTypes } from '@state/dashboard'

const updateCache = (activitiesDraft, patch = {}, isDelete) => {
  // find the index of the activity to update
  const index = activitiesDraft.findIndex((a) => a.activityId === patch.activityId)
  if (index === -1) {
    // add to the end of the list
    activitiesDraft.unshift(patch)
  } else if (isDelete) {
    activitiesDraft.splice(index, 1)
  } else {
    // update the activity
    activitiesDraft[index] = { ...activitiesDraft[index], ...patch }
  }
}

const patchActivities = async (
  { projectName, patch, entityIds = [], activityTypes = [], filter, refs = [] },
  { dispatch, queryFulfilled, getState },
  method,
) => {
  const refIds = refs.map((ref) => ref.id) || []
  // build tags that would be affected by this activity
  const invalidatingTags = [...entityIds, ...refIds].map((id) => ({
    type: 'entityActivities',
    id: id + '-' + filter,
  }))

  const state = getState()
  // get caches that would be affected by this activity
  const entries = api.util.selectInvalidatedBy(state, invalidatingTags)

  // now patch all the caches with the update
  const patches = entries.map(({ originalArgs }) =>
    dispatch(
      api.util.updateQueryData(
        'getActivities',
        { projectName, entityIds: originalArgs.entityIds, activityTypes, filter },
        (draft) => updateCache(draft.activities, patch, method === 'delete'),
      ),
    ),
  )

  try {
    await queryFulfilled
  } catch (error) {
    const message = `Error: ${error?.error?.data?.detail || `Failed to ${method} activity`}`
    console.error(message, error)
    toast.error(message)
    for (const patchResult of patches) {
      patchResult?.undo()
    }
  }
}

// get tags for other filter types
const getTags = ({ entityId, filter }) => {
  const invalidateFilters = Object.keys(filterActivityTypes).filter((key) => key !== filter)

  const tags = invalidateFilters.map((filter) => ({
    type: 'entityActivities',
    id: entityId + '-' + filter,
  }))

  tags.push({ type: 'activity', id: 'LIST' })

  tags.push({ type: 'watchers', id: entityId })

  return tags
}

const updateActivities = api.injectEndpoints({
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
      // invalidate other filters that might be affected by this new activity (comments, checklists, etc)
      invalidatesTags: (result, error, { entityId, filter }) => getTags({ entityId, filter }),
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
      // invalidate other filters that might be affected by this new activity (comments, checklists, etc)
      invalidatesTags: (result, error, { entityId, filter }) => getTags({ entityId, filter }),
    }),
    deleteActivity: build.mutation({
      query: ({ projectName, activityId }) => ({
        url: `/api/projects/${projectName}/activities/${activityId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'delete')
      },
      // invalidate other filters that might be affected by this new activity (comments, checklists, etc)
      invalidatesTags: (result, error, { entityId, filter }) => getTags({ entityId, filter }),
    }),
  }),
  overrideExisting: true,
})

export const {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} = updateActivities
