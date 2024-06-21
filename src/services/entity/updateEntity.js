import { ayonApi } from '../ayon'
import { toast } from 'react-toastify'
import { enhancedDashboardGraphqlApi } from '../userDashboard/getUserDashboard'
import { isEqual } from 'lodash'

const updateEntity = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEntity: build.mutation({
      query: ({ projectName, entityId, data, entityType }) => ({
        url: `/api/projects/${projectName}/${entityType}s/${entityId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted(
        { projectName, entityId, data, currentAssignees, entityType },
        { dispatch, queryFulfilled, getState },
      ) {
        let patchResult

        // if task, patch the GetKanban query
        if (entityType === 'task') {
          const state = getState()
          const dashboardProjects = getState().dashboard.selectedProjects
          const dashboardUsers = getState().dashboard.tasks.assignees
          const dashboardAssigneesIsMe = getState().dashboard.tasks.assigneesIsMe
          const newAssignees = data.assignees

          const cacheUsers = dashboardAssigneesIsMe ? [getState().user.name] : dashboardUsers

          const hasSomeAssignees = currentAssignees.some((assignee) =>
            cacheUsers.includes(assignee),
          )
          const hasSomeProjects = dashboardProjects.some((project) => project === projectName)
          const currentDashNeedsUpdating = hasSomeAssignees && hasSomeProjects

          let currentKanbanPatched = false

          console.log(cacheUsers, dashboardProjects, dashboardUsers, dashboardAssigneesIsMe)

          if (currentDashNeedsUpdating) {
            patchResult = dispatch(
              enhancedDashboardGraphqlApi.util.updateQueryData(
                'GetKanban',
                { projects: dashboardProjects, assignees: cacheUsers },
                (draft) => {
                  const taskIndex = draft.findIndex((task) => task.id === entityId)
                  if (taskIndex === -1) {
                    // task not found, assignee must have just been added
                  } else {
                    currentKanbanPatched = true

                    // first check that the task assignees still has a intersection with dashAssignees
                    const hasSomeAssignees = newAssignees?.some((assignee) =>
                      cacheUsers.includes(assignee),
                    )

                    if (!hasSomeAssignees && newAssignees) {
                      // remove from cache
                      draft.splice(taskIndex, 1)
                    } else {
                      // task found: update the task in the cache
                      const newData = { ...draft[taskIndex], ...data }
                      draft[taskIndex] = newData
                    }
                  }
                },
              ),
            )
          }

          // always update the kanban if task id matches
          const tags = [{ type: 'task', id: entityId }]

          // are we changing the assignees?
          if (newAssignees?.length) {
            const currentAssigneesSet = new Set(currentAssignees)
            const newAssigneesSet = new Set(newAssignees)

            const removedAssignees = [...currentAssigneesSet].filter(
              (assignee) => !newAssigneesSet.has(assignee),
            )
            const addedAssignees = [...newAssigneesSet].filter(
              (assignee) => !currentAssigneesSet.has(assignee),
            )

            const changedAssignees = [...new Set([...removedAssignees, ...addedAssignees])]

            // any query that has those changed assignees, needs to be updated
            // we are changing the assignees
            const assigneesTags = changedAssignees.map((assignee) => ({
              type: 'kanban',
              id: 'user-' + assignee + '-project-' + projectName,
            }))

            tags.push(...assigneesTags)
          }

          // invalidate any other caches
          let entries = enhancedDashboardGraphqlApi.util.selectInvalidatedBy(state, tags)

          // filter out current kanban query if we were able to patch it
          const currentKanbanCacheArgs = { projects: dashboardProjects, assignees: cacheUsers }
          if (currentKanbanPatched)
            entries = entries.filter(
              (entry) => !isEqual(entry.originalArgs, currentKanbanCacheArgs),
            )

          // create the invalidation tags from originalArgs
          const invalidationTags = entries.map((entry) => ({
            type: 'kanban',
            id: JSON.stringify(entry.originalArgs),
          }))

          // invalidate the cache
          // dispatch(enhancedDashboardGraphqlApi.util.invalidateTags(invalidationTags))
        }

        // patch any entity details panels in dashboard
        let entityDetailsResult = dispatch(
          ayonApi.util.updateQueryData(
            'getDashboardEntityDetails',
            { entityId, entityType, projectName },
            (draft) => {
              // convert assignees to users
              const patchData = { ...data }
              if (patchData.assignees) {
                patchData.users = patchData.assignees
                delete patchData.assignees
              }
              const newData = { ...draft, ...patchData }
              Object.assign(draft, newData)
            },
          ),
        )

        try {
          await queryFulfilled
        } catch (error) {
          console.error('error updating ' + entityType, error)
          toast.error(error?.error?.data?.detail || 'Failed to update task')
          patchResult?.undo()
          entityDetailsResult?.undo()
        }
      },
    }),
    updateEntities: build.mutation({
      async queryFn({ operations = [], entityType }, { dispatch }) {
        try {
          const promises = []
          for (const { projectName, data, id, currentAssignees = [] } of operations) {
            const promise = dispatch(
              ayonApi.endpoints.updateEntity.initiate({
                projectName: projectName,
                entityId: id,
                data,
                entityType,
                currentAssignees,
              }),
            )
            promises.push(promise)
          }

          // invalidate any entities queries (multi entity selection) to force refetch
          // but because we just updated the getEntityDetails cache it should be instant
          dispatch(
            ayonApi.util.invalidateTags(operations.map((o) => ({ type: 'entities', id: o.id }))),
          )

          // check if any of the requests failed and invalidate the tasks cache again to refetch
          const results = await Promise.allSettled(promises)
          if (results.some((result) => result.value?.error)) {
            dispatch(
              ayonApi.util.invalidateTags(
                operations.map((o) => ({ type: 'kanBanTask', id: o.id })),
              ),
            )
          }

          const activityTags = []

          // these are the fields that if changed will trigger a new activity
          // const fieldsWithNewActivity = ['status', 'assignees']

          // invalidate the activity query of the entity activities

          // operations.forEach((operation) => {
          //   // check if any of the fields in the operation data are in the fieldsWithNewActivity array
          //   const hasAtLeastOneField = fieldsWithNewActivity.some(
          //     (field) => field in (operation.data || {}),
          //   )
          //   if (hasAtLeastOneField) {
          //     const getActivitiesTags = [{ type: 'entityActivities', id: operation.id }]
          //     activityTags.push(...getActivitiesTags)
          //   }
          // })

          if (activityTags.length) {
            dispatch(ayonApi.util.invalidateTags(activityTags))
          }

          return { data: operations }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      // invalidatesTags: (result, error, { operations, entityType }) =>
      //   operations.map((o) => ({ id: o.id, type: 'entities' })),
    }),
  }),
})

export const { useUpdateEntitiesMutation } = updateEntity
