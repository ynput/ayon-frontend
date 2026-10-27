import api from './getEntity'
import { toast } from 'react-toastify'
import { dashboardQueries, getKanbanTasks } from '../userDashboard'
import { patchOverviewFolders, patchOverviewTasks } from '../overview'
import { patchDetailsPanel } from './patchDetailsPanel'
import { normalizeQueryError } from '@shared/api/base/queryError'
import { getRequestErrorString } from '@shared/util'
import { gqlApi } from '@shared/api/generated'
import type { GetTasksProgressQuery, KanbanNode, OperationModel } from '@shared/api/generated'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import type { RootState } from '@reduxjs/toolkit/query'

type EntityType = OperationModel['entityType']
type EntityData = Record<string, unknown> & {
  name?: string
  assignees?: string[]
  attrib?: Record<string, unknown> & { priority?: string; endDate?: string }
}

export type UpdateEntityArgs = {
  projectName: string
  entityId: string
  entityType: EntityType
  data: EntityData
  currentAssignees?: string[]
}

export type UpdateEntityOperation = Omit<UpdateEntityArgs, 'entityId'> & {
  id: string
  meta?: { folderId?: string }
}

export type UpdateEntitiesArgs = {
  operations: UpdateEntityOperation[]
  entityType: EntityType
}

type CacheContext = {
  state: RootState<any, any, any>
  dispatch: ThunkDispatch<any, unknown, UnknownAction>
}
type UndoPatch = { undo: () => void }
type KanbanArgs = { assignees: string[]; projects: string[] }
type KanbanPatch = {
  newAssignees?: string[]
  taskId: string
  data?: EntityData
  taskData?: KanbanNode
}
type ProgressTask = GetTasksProgressQuery['project']['tasks']['edges'][number]['node']
type ProgressFolder = ProgressTask['folder'] & {
  projectName: string
  tasks: ProgressTask[]
  path?: string
}

const patchKanban = (
  { assignees, projects }: KanbanArgs,
  { newAssignees, taskId, data, taskData }: KanbanPatch,
  { dispatch }: Pick<CacheContext, 'dispatch'>,
): [UndoPatch, boolean] => {
  let kanbanPatched = false
  const patchResult = dispatch(
    dashboardQueries.util.updateQueryData(
      'GetKanban',
      { projects: projects, assignees: assignees },
      (draft) => {
        const taskIndex = draft.findIndex((task) => task.id === taskId)
        let patchData = { ...data }
        // if the data include attrib.priority it needs to be transformed to just priority
        // this is because priority is a top level field on kanban query
        if (data?.attrib?.priority) {
          patchData = { ...patchData, priority: data.attrib.priority }
        }
        // if the data include attrib.endDate it needs to be transformed to dueDate
        // this is because dueDate is a top level field on kanban query
        // NOTE TO SELF: Lets try to do these transforms after the cache the future.
        if (data?.attrib?.endDate) {
          const { endDate, ...attrib } = data.attrib
          patchData = { ...patchData, attrib, dueDate: endDate }
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
            Object.assign(draft[taskIndex], patchData)
          }
        }
      },
    ),
  )

  return [patchResult as unknown as UndoPatch, kanbanPatched]
}

// try to patch the progress view if there are queries that need to be updated
const patchProgressView = ({
  operations,
  state,
  dispatch,
  entityType,
}: UpdateEntitiesArgs & CacheContext): UndoPatch[] => {
  // create invalidation tags for progress view
  const invalidationTags = operations.map((o) => ({ type: 'progress', id: o.id }))
  // find the entries that need to be updated
  const entries = gqlApi.util
    .selectInvalidatedBy(state, invalidationTags)
    .filter((entry) => entry.endpointName === 'GetTasksProgress')
  // if there are no entries, return
  if (!entries.length) return []

  try {
    // patch each entry with updated task data
    const patches = entries.map((entry) =>
      dispatch(
        gqlApi.util.updateQueryData('GetTasksProgress', entry.originalArgs, (cachedData) => {
          const draft = cachedData as unknown as ProgressFolder[]
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
              const newTask = Object.assign({}, task, patch)
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

              // If name is being updated, also update the path
              const updatedPatch = { ...patch }
              if (patch.name && folder.path) {
                // Construct new path by replacing the last segment with the new name
                const pathParts = folder.path.split('/')
                pathParts[pathParts.length - 1] = patch.name
                updatedPatch.path = pathParts.join('/')
              }

              // update folder
              const newFolder = { ...folder, ...updatedPatch }
              // update query
              const folderIndex = draft.findIndex((f) => f.id === entityId)
              draft[folderIndex] = newFolder
            }
          }
        }),
      ),
    )
    return patches as unknown as UndoPatch[]
  } catch (error) {
    console.error(error)
    // invalidate the progress view queries instead
    dispatch(gqlApi.util.invalidateTags(invalidationTags))
    return []
  }
}

const updateEntity = api.injectEndpoints({
  endpoints: (build) => ({
    updateEntity: build.mutation<unknown, UpdateEntityArgs>({
      query: ({ projectName, entityId, data, entityType }) => ({
        url: `/api/projects/${projectName}/${entityType}s/${entityId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { entityId, entityType }) => {
        const tags = []
        if (entityType === 'product') {
          tags.push({ type: 'product', id: entityId })
        }
        if (entityType === 'version') {
          tags.push({ type: 'version', id: entityId })
        }
        return tags
      },
      async onQueryStarted(
        { projectName, entityId, data, currentAssignees = [], entityType },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState()
        const patchResults: UndoPatch[] = []

        let invalidationTagsAfterComplete = []
        // if task, patch the GetKanban query
        if (entityType === 'task') {
          const dashboardState = getState() as unknown as {
            dashboard?: {
              selectedProjects?: string[]
              tasks?: { assignees?: string[]; assigneesFilter?: string }
            }
            user?: { name?: string }
          }
          const dashboardProjects = dashboardState.dashboard?.selectedProjects || []
          const dashboardUsers = dashboardState.dashboard?.tasks?.assignees || []
          const dashboardAssigneesIsMe = dashboardState.dashboard?.tasks?.assigneesFilter === 'me'
          const newAssignees = data.assignees

          const cacheUsers = dashboardAssigneesIsMe
            ? dashboardState.user?.name
              ? [dashboardState.user.name]
              : []
            : dashboardUsers

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
                    newTask = { ...newTask, assignees: newAssignees ?? newTask.assignees }

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
              dashboardQueries.util.invalidateTags([
                {
                  type: 'watchers',
                  id: entityId,
                },
              ]),
            )
          }

          // invalidate any other caches
          const entries = dashboardQueries.util
            .selectInvalidatedBy(state, tags)
            .filter((entry) => entry.endpointName === 'GetKanban')
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
            (entry) =>
              JSON.stringify(entry.originalArgs) !== JSON.stringify(currentKanbanCacheArgs),
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
        patchDetailsPanel([{ entityId, data, entityType }], { state, dispatch }, patchResults)

        try {
          await queryFulfilled

          // now invalidate any tags
          if (invalidationTagsAfterComplete.length) {
            dispatch(dashboardQueries.util.invalidateTags(invalidationTagsAfterComplete))
          }
        } catch (error) {
          toast.error(getRequestErrorString(error) || 'Failed to update task')
          patchResults.forEach((result) => result?.undo())
        }
      },
    }),
    updateEntities: build.mutation<UpdateEntityOperation[], UpdateEntitiesArgs>({
      async queryFn({ operations = [], entityType }, { dispatch, getState }) {
        try {
          const state = getState() as CacheContext['state']
          const promises = []
          for (const { projectName, data, id, currentAssignees = [] } of operations) {
            const promise = dispatch(
              updateEntity.endpoints.updateEntity.initiate({
                projectName: projectName,
                entityId: id,
                data,
                entityType,
                currentAssignees,
              }),
            )
            promises.push(promise)
          }

          let progressPatches: UndoPatch[] = []
          if (entityType === 'task' || entityType === 'folder') {
            // patch the progress page
            progressPatches = patchProgressView({ operations, state, dispatch, entityType })
          }

          const overviewPatches: UndoPatch[] = []
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
          const someError = results.some(
            (result) => result.status === 'rejected' || !!result.value.error,
          )
          if (someError) {
            dispatch(
              api.util.invalidateTags(operations.map((o) => ({ type: 'kanBanTask', id: o.id }))),
            )

            // revert the progress view patches
            progressPatches.forEach((patch) => patch?.undo())

            // revert the overview patches
            overviewPatches.forEach((patch) => patch?.undo())

            return { error: normalizeQueryError('Failed to update some tasks', 400) }
          }

          return { data: operations }
        } catch (error) {
          console.error(error)
          return { error: normalizeQueryError(error) }
        }
      },
      invalidatesTags: (result, error, { operations, entityType }) => {
        const tags = operations.map((o) => ({ id: o.id, type: 'review' }))

        // own-edit activity events are sender-filtered on the websocket, so refetch open feeds
        const activityFields = ['status', 'attrib', 'tags', 'assignees', `${entityType}Type`]
        operations.forEach((o) => {
          if (o.data && activityFields.some((key) => o.data[key] !== undefined)) {
            tags.push({ type: 'entityActivities', id: o.id })
          }
        })

        if (entityType === 'product') {
          tags.push({ type: 'product', id: 'LIST' }, { type: 'version', id: 'LIST' })
          operations.forEach((o) => tags.push({ type: 'product', id: o.id }))
        }
        if (entityType === 'version') {
          tags.push({ type: 'version', id: 'LIST' }, { type: 'product', id: 'LIST' })
          operations.forEach((o) => tags.push({ type: 'version', id: o.id }))
          if (operations.some((o) => !!o.data.status)) {
            console.log('invalidate version.publish activities')
            // invalidate feeds with that version in it (published versions activity)
            operations.forEach((o) =>
              tags.push({ type: 'entityActivities', id: `version.publish-${o.id}` }),
            )
          }
        }

        return tags
      },
    }),
  }),
  overrideExisting: true,
})

export const { useUpdateEntitiesMutation, useUpdateEntityMutation } = updateEntity
export { updateEntity as entitiesQueries }
