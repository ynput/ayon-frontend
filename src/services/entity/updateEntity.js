import { ayonApi } from '../ayon'
import { toast } from 'react-toastify'
import { enhancedDashboardGraphqlApi, getKanbanTasks } from '../userDashboard/getUserDashboard'
import { isEqual } from 'lodash'

const patchKanban = (
  { assignees = [], projects = [] },
  { newAssignees, taskId, data, taskData },
  { dispatch },
) => {
  let kanbanPatched = false
  const patchResult = dispatch(
    enhancedDashboardGraphqlApi.util.updateQueryData(
      'GetKanban',
      { projects: projects, assignees: assignees },
      (draft) => {
        const taskIndex = draft.findIndex((task) => task.id === taskId)
        if (taskIndex === -1) {
          // task not found, assignee must have just been added
          if (taskData) {
            // add the task to the cache
            draft.push(taskData)
          } else {
            // we don't have the task data, so we can't add it to the cache
            // we might add it later
            kanbanPatched = false
          }
        } else {
          kanbanPatched = true
          // first check that the task assignees still has a intersection with dashAssignees
          const hasSomeAssignees = newAssignees?.some((assignee) => assignees.includes(assignee))

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

  return [patchResult, kanbanPatched]
}

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
        const patchResults = []

        let invalidationTagsAfterComplete = []
        // if task, patch the GetKanban query
        if (entityType === 'task') {
          const state = getState()
          const dashboardProjects = getState().dashboard.selectedProjects
          const dashboardUsers = getState().dashboard.tasks.assignees
          const dashboardAssigneesIsMe = getState().dashboard.tasks.assigneesFilter === 'me'
          const newAssignees = data.assignees

          const cacheUsers = dashboardAssigneesIsMe ? [getState().user.name] : dashboardUsers

          const entityAssignees = [...new Set([...currentAssignees, ...(newAssignees || [])])]
          const hasSomeAssignees = entityAssignees.some((assignee) => cacheUsers.includes(assignee))
          const hasSomeProjects = dashboardProjects.some((project) => project === projectName)
          const currentDashNeedsUpdating = hasSomeAssignees && hasSomeProjects

          if (currentDashNeedsUpdating) {
            const [result, wasPatched] = patchKanban(
              { assignees: cacheUsers, projects: dashboardProjects },
              { newAssignees, taskId: entityId, data },
              { dispatch },
            )

            if (wasPatched) patchResults.push(result)

            if (!wasPatched) {
              // this means the task is not in the current kanban and it needs to be added

              // get the new task data
              getKanbanTasks({ projects: [projectName], taskIds: [entityId] }, dispatch).then(
                // use .then so that the rest of the code can run
                (response) => {
                  let newTask = response.find((task) => task.id === entityId)
                  if (newTask) {
                    // add newAssignees as the actual DB hasn't been updated yet
                    newTask = { ...newTask, assignees: newAssignees }

                    patchKanban(
                      { assignees: cacheUsers, projects: dashboardProjects },
                      { newAssignees, taskId: entityId, taskData: newTask },
                      { dispatch },
                    )
                  }
                },
              )
            }
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
          let entriesToInvalidate = []

          // for each entry try to patch the data into the cache first
          for (const entry of entries) {
            const [patchResult, wasPatched] = patchKanban(
              {
                assignees: entry.originalArgs.assignees,
                projects: entry.originalArgs.projects,
              },
              {
                newAssignees,
                taskId: entityId,
                data,
              },
              { dispatch },
            )

            if (wasPatched) {
              patchResults.push(patchResult)
            } else {
              // if we couldn't patch, we need to invalidate the cache
              entriesToInvalidate.push(entry)
            }
          }

          // filter out current kanban query if we were able to patch it
          const currentKanbanCacheArgs = { projects: dashboardProjects, assignees: cacheUsers }
          entriesToInvalidate = entriesToInvalidate.filter(
            (entry) => !isEqual(entry.originalArgs, currentKanbanCacheArgs),
          )

          // create the invalidation tags from originalArgs
          const invalidationTags = entries.map((entry) => ({
            type: 'kanban',
            id: JSON.stringify(entry.originalArgs),
          }))

          // invalidate the tags later, once the query is complete
          invalidationTagsAfterComplete.push(...invalidationTags)
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

        patchResults.push(entityDetailsResult)

        try {
          await queryFulfilled

          // now invalidate any tags
          if (invalidationTagsAfterComplete.length) {
            dispatch(enhancedDashboardGraphqlApi.util.invalidateTags(invalidationTagsAfterComplete))
          }
        } catch (error) {
          console.error('error updating ' + entityType, error)
          toast.error(error?.error?.data?.detail || 'Failed to update task')
          patchResults.forEach((result) => result?.undo())
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

          // update the getEntitiesDetails query with new data
          // this is the current details panel we are looking at right now
          // other details panel caches are invalidated above
          const entitiesArg = operations.map((o) => ({
            id: o.id,
            projectName: o.projectName,
          }))
          dispatch(
            ayonApi.util.updateQueryData(
              'getDashboardEntitiesDetails',
              { entities: entitiesArg, entityType },
              (draft) => {
                operations.forEach((operation) => {
                  // find entity in the cache
                  const entityIndex = draft.findIndex((entity) => entity.id === operation.id)

                  if (entityIndex === -1) return
                  const patchData = { ...operation.data }
                  if (patchData.assignees) {
                    patchData.users = patchData.assignees
                    delete patchData.assignees
                  }

                  // merge the new data into the entity
                  const newData = { ...draft[entityIndex], ...patchData }

                  draft[entityIndex] = newData
                })
              },
            ),
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
