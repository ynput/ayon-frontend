import { GetKanbanQuery } from '@/api/graphql'
import { $Any } from '@/types'
import api from '@api'
import PubSub from '@/pubsub'

type KanbanNode = GetKanbanQuery['kanban']['edges'][0]['node']
type GetKanbanResponse = KanbanNode[]

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { isEqual } from 'lodash'
type Definitions = DefinitionsFromApi<typeof api.graphql>
type TagTypes = TagTypesFromApi<typeof api.graphql>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetKanban' | 'GetKanbanTasks'> & {
  GetKanban: OverrideResultType<Definitions['GetKanban'], GetKanbanResponse>
  GetKanbanTasks: OverrideResultType<Definitions['GetKanbanTasks'], GetKanbanResponse>
}

const transformKanban = (response: GetKanbanQuery) => response.kanban.edges.map(({ node }) => node)

const provideKanbanTags = (result: GetKanbanResponse | undefined) =>
  result
    ? [{ type: 'kanBanTask', id: 'LIST' }, ...result.map(({ id }) => ({ type: 'task', id }))]
    : [{ type: 'kanBanTask', id: 'LIST' }]

const enhancedDashboardGraphqlApi = api.graphql.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetKanban: {
      transformResponse: transformKanban,
      providesTags: provideKanbanTags,
      async onCacheEntryAdded(
        { assignees = [], projects = [] } = {},
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getState },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const patchKanbanTask = async ({
            projects = [],
            taskIds = [],
          }: {
            projects: string[]
            taskIds: string[]
          }) => {
            // get the task
            const response = await dispatch(
              enhancedDashboardGraphqlApi.endpoints.GetKanbanTasks.initiate(
                { projects, taskIds },
                { forceRefetch: true },
              ),
            )

            if (response.status === 'rejected') {
              console.error('No tasks found', taskIds)
              throw new Error(`No tasks found ${taskIds.join(', ')}`)
            }

            // get tasks from response (usually only one task)
            const tasks = response.data

            if (!tasks) return

            // get all tasks that have been ADDED to the assignees
            const tasksWithArgAssignees = tasks.filter((task) =>
              task.assignees.some((assignee) => assignees?.includes(assignee)),
            )
            // get all tasks that have been REMOVED from the assignees
            const tasksWithoutArgAssignees = tasks.filter(
              (task) => !task.assignees.some((assignee) => assignees?.includes(assignee)),
            )

            // patch the kanban query by adding new tasks and remove old tasks
            updateCachedData((draft) => {
              // add new tasks
              tasksWithArgAssignees.forEach((task) => {
                const index = draft.findIndex((t) => t.id === task.id)
                if (index === -1) {
                  draft.push(task)
                } else {
                  draft[index] = task
                }
              })
              // remove old tasks
              tasksWithoutArgAssignees.forEach((task) => {
                const index = draft.findIndex((t) => t.id === task.id)
                if (index !== -1) {
                  draft.splice(index, 1)
                }
              })
            })
          }

          const handlePubSub = async (_topic: string, message: $Any) => {
            // ignore type warning because dashboard does exist
            // @ts-ignore
            let currentAssignees = getState().dashboard.tasks.assignees as string[]
            // @ts-ignore
            const assigneesIsMe = getState().dashboard.tasks.assigneesIsMe as boolean
            // currentAssignees state will be empty if assigneesIsMe is true
            // so we need to get me user
            // ignore type warning because user does exist
            // @ts-ignore
            if (assigneesIsMe) currentAssignees = [getState().user.name] as string
            const isSameAssignees = isEqual(currentAssignees, assignees)

            // check to see if this query is the query we are currently using (has same assignees)
            // multiple queries can be active at the same time with different combinations of assignees
            if (!isSameAssignees) return console.log('assignees do not match')

            const project = message.project as string
            // first check the project name as selected
            if (!projects?.includes(project)) return console.log('project not selected')
            // then get entity id
            const entityId = message.summary.entityId
            if (!entityId) return console.log('no entity id found')

            // patch task updates into kanban cache
            patchKanbanTask({
              taskIds: [entityId],
              projects: [project],
            })
          }

          // sub to websocket topic
          token = PubSub.subscribe('entity.task', handlePubSub)
        } catch (error) {
          console.error(error)
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    },
    // same query as GetKanban but for specific tasks
    // used mainly for patching tasks into the kanban cache
    GetKanbanTasks: {
      transformResponse: transformKanban,
      providesTags: provideKanbanTags,
    },
  },
})

export const { useGetKanbanQuery } = enhancedDashboardGraphqlApi
