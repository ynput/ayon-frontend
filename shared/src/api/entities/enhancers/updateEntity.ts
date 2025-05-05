// @ts-nocheck

import { getEntityApi as api } from './getEntity'
import { patchDetailsPanelEntity } from '@shared/api'
import { toast } from 'react-toastify'
import {
  enhancedDashboardGraphqlApi,
  getKanbanTasks,
} from '../../userDashboard/enhancers/getUserDashboard'
import { isEqual } from 'lodash'
import { patchOverviewFolders, patchOverviewTasks } from '@shared/api'

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
        let patchData = { ...data }
        // if the data include attrib.priority it needs to be transformed to just priority
        // this is because priority is a top level field on kanban query
        if (data?.attrib?.priority) {
          const { priority } = patchData.attrib
          patchData = { ...patchData, priority }
        }
        // if the data include attrib.endDate it needs to be transformed to dueDate
        // this is because dueDate is a top level field on kanban query
        // NOTE TO SELF: Lets try to do these transforms after the cache the future.
        if (data?.attrib?.endDate) {
          const { endDate } = patchData.attrib
          patchData = { ...patchData, dueDate: endDate }
          delete patchData.attrib.endDate
        }

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
            const newData = { ...draft[taskIndex], ...patchData }
            draft[taskIndex] = newData
          }
        }
      },
    ),
  )

  return [patchResult, kanbanPatched]
}

// try to patch the progress view if there are queries that need to be updated
const patchProgressView = ({ operations = [], state, dispatch, entityType }) => {
  // create invalidation tags for progress view
  const invalidationTags = operations.map((o) => ({ type: 'progress', id: o.id }))
  // find the entries that need to be updated
  let entries = api.util.selectInvalidatedBy(state, invalidationTags)
  // if there are no entries, return
  if (!entries.length) return []

  try {
    // patch each entry with updated task data
    const patches = entries.map((entry) =>
      dispatch(
        api.util.updateQueryData(entry.endpointName, entry.originalArgs, (draft) => {
          for (const operation of operations) {
            const entityId = operation.id
            const patch = operation.data

            // patch the updated task data
            if (entityType === 'task') {
              const folderId = operation.meta?.folderId
              const folder = draft.find((folder) => folder.id === folderId)
              if (!folder) throw new Error('Patching progress view: folder not found')
              const task = folder.tasks?.find((task) => task.id === entityId)
              if (!task) throw new Error('Patching progress view: task not found')
              // update task
              const newTask = { ...task, ...patch }
              // update folder
              const newFolder = {
                ...folder,
                tasks: folder.tasks.map((t) => (t.id === entityId ? newTask : t)),
              }
              // update query
              const folderIndex = draft.findIndex((f) => f.id === folderId)
              draft[folderIndex] = newFolder
            } else if (entityType === 'folder') {
              const folder = draft.find((folder) => folder.id === entityId)
              if (!folder) throw new Error('Patching progress view: folder not found')
              // update folder
              const newFolder = { ...folder, ...patch }
              // update query
              const folderIndex = draft.findIndex((f) => f.id === entityId)
              draft[folderIndex] = newFolder
            }
          }
        }),
      ),
    )
    return patches
  } catch (error) {
    console.error(error)
    // invalidate the progress view queries instead
    dispatch(api.util.invalidateTags(invalidationTags))
    return []
  }
}

const updateEntity = api.injectEndpoints({
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
        const state = getState()
        const patchResults = []

        let invalidationTagsAfterComplete = []
        // if task, patch the GetKanban query
        if (entityType === 'task') {
          const dashboardProjects = getState().dashboard?.selectedProjects || []
          const dashboardUsers = getState().dashboard?.tasks.assignees || []
          const dashboardAssigneesIsMe = getState().dashboard?.tasks.assigneesFilter === 'me'
          const newAssignees = data.assignees

          const cacheUsers = dashboardAssigneesIsMe ? [getState().user?.name] : dashboardUsers

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

            // invalidate the watchers query
            dispatch(
              enhancedDashboardGraphqlApi.util.invalidateTags([
                {
                  type: 'watchers',
                  id: entityId,
                },
              ]),
            )
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

        // get all details panel caches that would be affected by this update
        const detailsPanelTags = [
          {
            type: 'entities',
            id: entityId,
          },
        ]

        const detailsPanelEntries = api.util.selectInvalidatedBy(state, detailsPanelTags)

        for (const entry of detailsPanelEntries) {
          // patch any entity details panels in dashboard
          let entityDetailsResult = dispatch(
            api.util.updateQueryData('getEntitiesDetailsPanel', entry.originalArgs, (draft) => {
              for (const entity of draft) {
                patchDetailsPanelEntity([{ entityId, data, entityType }], entity)
              }
            }),
          )

          patchResults.push(entityDetailsResult)
        }

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
      async queryFn({ operations = [], entityType }, { dispatch, getState }) {
        try {
          const state = getState()
          const promises = []
          for (const { projectName, data, id, currentAssignees = [] } of operations) {
            const promise = dispatch(
              api.endpoints.updateEntity.initiate({
                projectName: projectName,
                entityId: id,
                data,
                entityType,
                currentAssignees,
              }),
            )
            promises.push(promise)
          }

          let progressPatches = []
          if (entityType === 'task' || entityType === 'folder') {
            // patch the progress page
            progressPatches = patchProgressView({ operations, state, dispatch, entityType })
          }

          const overviewPatches = []
          // convert id in operations to entityId
          const operationsWithEntityId = operations.map((o) => ({ ...o, entityId: o.id }))
          if (entityType === 'task' || entityType === 'folder') {
            // patch the overview page
            if (entityType === 'task') {
              patchOverviewTasks(operationsWithEntityId, { state, dispatch }, overviewPatches)
            }
            if (entityType === 'folder') {
              // patch the overview page
              patchOverviewFolders(operationsWithEntityId, { state, dispatch }, overviewPatches)
              console.log('invalidate overview folders')
              // invalidate overview folders query
              dispatch(api.util.invalidateTags([{ type: 'folder', id: 'LIST' }]))
              // invalidate overview tasks with folder as a parent
              dispatch(
                api.util.invalidateTags(
                  operationsWithEntityId.map((o) => ({ type: 'overviewTask', id: o.entityId })),
                ),
              )
            }
          }

          // check if any of the requests failed and invalidate the tasks cache again to refetch
          const results = await Promise.allSettled(promises)

          // did any of the requests fail?
          const someError = results.some((result) => result.value?.error)
          if (someError) {
            dispatch(
              api.util.invalidateTags(operations.map((o) => ({ type: 'kanBanTask', id: o.id }))),
            )

            // revert the progress view patches
            progressPatches.forEach((patch) => patch?.undo())

            // revert the overview patches
            overviewPatches.forEach((patch) => patch?.undo())

            throw 'Failed to update some tasks'
          }

          const activityTags = []

          if (activityTags.length) {
            dispatch(api.util.invalidateTags(activityTags))
          }

          return { data: operations }
        } catch (error) {
          console.error(error)
          return { error }
        }
      },
      invalidatesTags: (result, error, { operations }) => [
        ...operations.map((o) => ({ id: o.id, type: 'review' })),
      ],
    }),
  }),
  overrideExisting: true,
})

export const { useUpdateEntitiesMutation, useUpdateEntityMutation } = updateEntity
