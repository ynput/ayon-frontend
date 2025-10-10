import getActivitiesGQLApi from './getActivities'
import { toast } from 'react-toastify'
import { filterActivityTypes } from './util/activitiesHelpers'

const updateCache = (activitiesDraft: any, patch: any, isDelete: boolean) => {
  // Handle paginated structure
  if (isDelete) {
    // Remove from any page where it exists
    for (const page of activitiesDraft.pages) {
      const index = page.activities.findIndex((a: any) => a.activityId === patch.activityId)
      if (index !== -1) {
        page.activities.splice(index, 1)
        return
      }
    }
  } else {
    // Try to update existing activity
    let activityFound = false

    for (const page of activitiesDraft.pages) {
      const index = page.activities.findIndex((a: any) => a.activityId === patch.activityId)
      if (index !== -1) {
        // Update the activity
        page.activities[index] = { ...page.activities[index], ...patch }
        activityFound = true
        break
      }
    }

    // If activity doesn't exist and this is not a delete operation, add to first page
    if (!activityFound && activitiesDraft.pages.length > 0) {
      activitiesDraft.pages[0].activities.unshift(patch)
    }
  }
}

const patchActivities = async (
  { patch, entityIds = [], filter, refs = [] }: any,
  { dispatch, queryFulfilled, getState }: any,
  method: 'create' | 'update' | 'delete',
) => {
  const refIds = refs.map((ref: any) => ref.id) || []
  // build tags that would be affected by this activity
  const invalidatingTags = [...entityIds, ...refIds].map((id) => ({
    type: 'entityActivities',
    id: id + '-' + filter,
  }))

  const state = getState()
  // get caches that would be affected by this activity
  const entries = getActivitiesGQLApi.util.selectInvalidatedBy(state, invalidatingTags)

  // ensure that data is mapped to activityData
  if (method !== 'delete' && patch.data) {
    patch.activityData = { ...patch.activityData, ...patch.data }
  }

  // now patch all the caches with the update
  const patches = entries.map(({ originalArgs }) =>
    dispatch(
      getActivitiesGQLApi.util.updateQueryData('getActivitiesInfinite', originalArgs, (draft) =>
        updateCache(draft, patch, method === 'delete'),
      ),
    ),
  )

  try {
    await queryFulfilled
  } catch (error: any) {
    const message = `Error: ${error?.error?.data?.detail || `Failed to ${method} activity`}`
    console.error(message, error)
    toast.error(message)
    for (const patchResult of patches) {
      patchResult?.undo()
    }
  }
}

// get tags for other filter types
const getTags = ({ entityId, filter }: { entityId: string; filter: string }) => {
  const invalidateFilters = Object.keys(filterActivityTypes).filter((key) => key !== filter)

  const tags = invalidateFilters.map((filter) => ({
    type: 'entityActivities',
    id: entityId + '-' + filter,
  }))

  tags.push({ type: 'activity', id: 'LIST' })

  tags.push({ type: 'watchers', id: entityId })

  return tags
}

const updateActivitiesApi = getActivitiesGQLApi.injectEndpoints({
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
} = updateActivitiesApi
export { updateActivitiesApi as activitiesQueries }
