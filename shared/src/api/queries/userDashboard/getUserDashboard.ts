import {
  gqlApi,
  GetKanbanProjectUsersQuery,
  GetKanbanQuery,
  ProjectModel,
  KanbanNode,
  Anatomy,
} from '@shared/api/generated'
import { projectQueries } from '../project'
import PubSub from '@shared/util/pubsub'
import {
  createRealtimeBatcher,
  getSupportedEntityPatch,
  REALTIME_REST_CALL_LIMIT,
  REALTIME_TASK_SUPPORTED_VALUE_FIELDS,
  RealtimeBatchProcessor,
  subscribeToThumbnailUpdates,
  SupportedTaskField,
  ThumbnailUpdateMessage,
  waitForRealtimeJitter,
} from '@shared/util'
import convertAccessGroupsData, { AccessGroups } from './convertAccessGroupsData'

// GetKanban response type
export type GetKanbanResponse = KanbanNode[]

// GetKanbanProjectUsers response type
export type KanbanProjectUserNode = Omit<
  GetKanbanProjectUsersQuery['users']['edges'][0]['node'],
  'accessGroups'
> & { accessGroups: AccessGroups; projects: string[]; avatarUrl: string }
export type GetKanbanProjectUsersResponse = KanbanProjectUserNode[]

export interface MessageSummary {
  entityId: string
  entityPath: string
  parentId: string
  value: any
}

export interface Message {
  id: string
  topic: string
  project: string
  user: string
  sender: string
  senderType: string
  description: string
  status: string
  progress: number
  store: boolean
  createdAt: string
  updatedAt: string
  dependsOn: string | null
  summary: MessageSummary
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import getUserProjectsAccess from './getUserProjectsAccess'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<
  Definitions,
  'GetKanban' | 'GetKanbanTasks' | 'GetKanbanProjectUsers'
> & {
  GetKanban: OverrideResultType<Definitions['GetKanban'], GetKanbanResponse>
  GetKanbanTasks: OverrideResultType<Definitions['GetKanbanTasks'], GetKanbanResponse>
  GetKanbanProjectUsers: OverrideResultType<
    Definitions['GetKanbanProjectUsers'],
    GetKanbanProjectUsersResponse
  >
}

// get edges and sort by task label || name
const transformKanban = (response: GetKanbanQuery) =>
  response.kanban.edges
    .map(({ node }) => node)
    .sort((a, b) => {
      const aLabel = a.label || a.name
      const bLabel = b.label || b.name
      return aLabel.localeCompare(bLabel)
    })

const provideKanbanTags = (result: GetKanbanResponse | undefined, _error: any, args: any) =>
  result?.length
    ? [
        { type: 'kanBanTask', id: 'LIST' },
        ...result.flatMap(({ id, projectName, assignees = [] }) => [
          { type: 'task', id },
          { type: 'kanban', id: 'project-' + projectName },
          ...assignees.map((assignee) => ({ type: 'kanban', id: 'user-' + assignee })),
          ...assignees.map((assignee) => ({
            type: 'kanban',
            id: 'user-' + assignee + '-project-' + projectName,
          })),
          { type: 'kanban', id: JSON.stringify(args) },
        ]),
      ]
    : [{ type: 'kanBanTask', id: 'LIST' }]

export const getKanbanTasks = async (
  {
    projects = [],
    taskIds = [],
  }: {
    projects: string[]
    taskIds: string[]
  },
  dispatch: ThunkDispatch<any, any, UnknownAction>,
) => {
  try {
    projects = projects ?? []
    taskIds = taskIds ?? []
    // get the task
    const response = await dispatch(
      enhancedDashboardGraphqlApi.endpoints.GetKanbanTasks.initiate(
        { projects, taskIds },
        { forceRefetch: true },
      ),
    )

    if (response.status === 'rejected' || !response.data) {
      console.error('No tasks found', taskIds)
      throw new Error(`No tasks found ${taskIds.join(', ')}`)
    }

    if (response.status !== 'fulfilled') return []
    // get tasks from response (usually only one task)
    return response.data
  } catch (error) {
    console.error(error)
    return []
  }
}

const enhancedDashboardGraphqlApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetKanban: {
      transformResponse: transformKanban,
      providesTags: provideKanbanTags,
      async onCacheEntryAdded(
        args = {},
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        let unsubscribeThumbnails: (() => void) | undefined
        const batchProcessMessages: RealtimeBatchProcessor<{
          topic: string
          message: Message
        }> = async (updates, isActive) => {
          const selectedProjects: string[] = Array.isArray(args?.projects) ? args.projects : []
          const selectedAssignees: string[] = Array.isArray(args?.assignees) ? args.assignees : []
          // Current tasks on the board. Re-read the cache when the batch runs because it may
          // have changed while the realtime updates were waiting in the debounce window.
          const cacheTasks = getCacheEntry().data ?? []
          const cachedTaskKeys = new Set(cacheTasks.map((task) => `${task.projectName}:${task.id}`))
          const taskUpdatesToFetch = new Map<string, { taskId: string; project: string }>()
          const patches: {
            taskId: string
            project: string
            field: SupportedTaskField
            value: string | string[]
          }[] = []

          updates.forEach(({ topic, message }) => {
            // First check the project name as selected.
            const project = message.project
            if (!project || !selectedProjects.includes(project)) return

            const taskId = message.summary?.entityId
            if (!taskId) return

            // Only patch the task for the fields supported by the Kanban view.
            const field = topic.split('.')[2]?.replace('_changed', '')
            const patch = getSupportedEntityPatch(
              field,
              message.summary,
              REALTIME_TASK_SUPPORTED_VALUE_FIELDS,
            )
            if (!patch) return

            const taskKey = `${project}:${taskId}`
            const isTaskOnMyBoard = cachedTaskKeys.has(taskKey)
            const patchValue = patch.value
            const isValueMe =
              patch.field === 'assignees' &&
              (patchValue as string[]).some((assignee) => selectedAssignees.includes(assignee))

            // A task not currently on the board only matters when an assignee update
            // makes it relevant to the selected users.
            if (!isTaskOnMyBoard && !isValueMe) return

            if (!isTaskOnMyBoard) {
              taskUpdatesToFetch.set(taskKey, { taskId, project })
              return
            }

            patches.push({
              taskId,
              project,
              field: patch.field as SupportedTaskField,
              value: patch.value,
            })
          })

          if (patches.length) {
            updateCachedData((draft) => {
              patches.forEach(({ taskId, project, field, value }) => {
                const task = draft.find(
                  (item) => item.id === taskId && item.projectName === project,
                )
                if (!task) return

                // Patch the Kanban cache directly for supported fields.
                Object.assign(task, { [field === 'type' ? 'taskType' : field]: value })
                if (
                  field === 'assignees' &&
                  selectedAssignees.length > 0 &&
                  !(value as string[]).some((assignee) => selectedAssignees.includes(assignee))
                ) {
                  const index = draft.indexOf(task)
                  if (index !== -1) draft.splice(index, 1)
                }
              })
            })
          }

          const fetchUpdates = Array.from(taskUpdatesToFetch.values())
          if (!fetchUpdates.length || fetchUpdates.length > REALTIME_REST_CALL_LIMIT) return

          // Fetch tasks that have just become relevant to the selected assignees.
          await waitForRealtimeJitter()
          const tasks = await getKanbanTasks(
            {
              projects: [...new Set(fetchUpdates.map(({ project }) => project))],
              taskIds: [...new Set(fetchUpdates.map(({ taskId }) => taskId))],
            },
            dispatch,
          )
          if (!isActive()) return

          // Get all tasks that have been ADDED to the assignees.
          const tasksWithArgAssignees = tasks.filter(
            (task) =>
              !selectedAssignees.length ||
              (task.assignees ?? []).some((assignee) => selectedAssignees.includes(assignee)),
          )
          // Get all tasks that have been REMOVED from the assignees.
          const tasksWithoutArgAssignees = tasks.filter(
            (task) =>
              selectedAssignees.length > 0 &&
              !(task.assignees ?? []).some((assignee) => selectedAssignees.includes(assignee)),
          )

          // Patch the Kanban query by adding new tasks and removing old tasks.
          updateCachedData((draft) => {
            // Add new tasks or update existing tasks.
            tasksWithArgAssignees.forEach((task) => {
              const index = draft.findIndex((cachedTask) => cachedTask.id === task.id)
              if (index === -1) draft.push(task)
              else draft[index] = task
            })
            // Remove old tasks.
            tasksWithoutArgAssignees.forEach((task) => {
              const index = draft.findIndex((cachedTask) => cachedTask.id === task.id)
              if (index !== -1) draft.splice(index, 1)
            })
          })
        }
        const batcher = createRealtimeBatcher(
          batchProcessMessages,
          ({ topic, message }) => `${message.project ?? ''}:${message.summary?.entityId}:${topic}`,
        )
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              const cacheTasks = getCacheEntry().data ?? []
              if (!cacheTasks.length) return

              const matchedMessages = messages.filter((m) =>
                cacheTasks.some((t) => t.id === m.summary.entityId && t.projectName === m.project),
              )
              if (matchedMessages.length === 0) return

              updateCachedData((draft) => {
                matchedMessages.forEach((message) => {
                  const entityIndex = draft.findIndex((t) => t.id === message.summary.entityId)
                  if (entityIndex !== -1 && draft[entityIndex] && message.summary.thumbnailHash) {
                    draft[entityIndex].thumbnailHash = message.summary.thumbnailHash
                  }
                })
              })
            },
            ['task'],
          )

          const handlePubSub = (_topic: string, message: Message) => {
            if (!message?.summary?.entityId) return
            batcher.add({ topic: _topic, message })
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
        if (unsubscribeThumbnails) {
          unsubscribeThumbnails()
        }
        batcher.clear()
      },
      // // there is only one cache for kanban
      // serializeQueryArgs: () => '',
      // // whenever the assignees or projects change, we need to refetch the one query
      // forceRefetch: (params) => {
      //   const { currentArg, previousArg } = params
      //   // if the assignees are different, we need to refetch the query
      //   if (!isEqual(currentArg?.assignees, previousArg?.assignees)) return true
      //   // if the projects are different, we need to refetch the query
      //   if (!isEqual(currentArg?.projects, previousArg?.projects)) return true
      //   return false
      // },
    },
    // same query as GetKanban but for specific tasks
    // used mainly for patching tasks into the kanban cache
    GetKanbanTasks: {
      transformResponse: transformKanban,
      providesTags: provideKanbanTags,
    },
    // get all users on all selected projects
    GetKanbanProjectUsers: {
      transformResponse: (response: GetKanbanProjectUsersQuery, _meta, { projects } = {}) =>
        response.users.edges.map(({ node: user }) => {
          const accessGroups = convertAccessGroupsData(user.accessGroups)
          // parse access groups json
          const isUser = !user.isManager && !user.isAdmin
          // get the projects that the user has access to
          let projectsAccess = isUser ? getUserProjectsAccess(accessGroups) : projects
          if (typeof projectsAccess === 'string' || !projectsAccess) projectsAccess = []

          // assignees select requires avatarUrl
          const avatarUrl = `/api/users/${user.name}/avatar`

          return {
            ...user,
            accessGroups: accessGroups,
            projects: projectsAccess,
            avatarUrl,
          }
        }),
      providesTags: (result) =>
        result?.length
          ? [
              { type: 'user', id: 'LIST' },
              ...result.map(({ name }) => ({ type: 'user', id: name })),
            ]
          : [{ type: 'user', id: 'LIST' }],
    },
  },
})

export const { useGetKanbanQuery, useGetKanbanProjectUsersQuery } = enhancedDashboardGraphqlApi

type GetProjectsInfoParams = {
  projects: string[]
  anatomy?: boolean
}

export type ProjectModeWithAnatomy = ProjectModel & { anatomy?: Anatomy }

export type GetProjectsInfoResponse = { [projectName: string]: ProjectModeWithAnatomy | undefined }

const injectedDashboardRestApi = enhancedDashboardGraphqlApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsInfo: build.query<GetProjectsInfoResponse, GetProjectsInfoParams>({
      async queryFn({ projects = [], anatomy = true }, { dispatch }) {
        try {
          // get project info for each project
          const projectInfo: Record<string, ProjectModeWithAnatomy | undefined> = {}
          for (const project of projects) {
            const projectName = project as string
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            const responses = [
              dispatch(projectQueries.endpoints.getProject.initiate({ projectName })).unwrap(),
              ...(anatomy
                ? [
                    dispatch(
                      projectQueries.endpoints.getProjectAnatomy.initiate({ projectName }),
                    ).unwrap(),
                  ]
                : []),
            ]

            const settled = await Promise.allSettled(responses)

            const projectDataResult = settled[0]
            const projectData =
              projectDataResult.status === 'fulfilled'
                ? (projectDataResult.value as ProjectModel)
                : undefined
            const anatomyData =
              anatomy && settled[1]?.status === 'fulfilled'
                ? (settled[1].value as Anatomy)
                : undefined

            if (projectData) {
              projectInfo[projectName] = {
                ...projectData,
                anatomy: anatomyData,
              } as ProjectModeWithAnatomy
            }
          }

          return { data: projectInfo, meta: undefined, error: undefined }
        } catch (error: any) {
          console.error(error)
          return { error, meta: undefined, data: undefined }
        }
      },
      providesTags: (_res, _error, { projects }) =>
        projects.map((projectName) => ({ type: 'project', id: projectName })),
    }),
  }),
})

export const { useGetProjectsInfoQuery } = injectedDashboardRestApi
export { injectedDashboardRestApi as dashboardQueries }
