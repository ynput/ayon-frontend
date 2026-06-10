import {
  gqlApi,
  GetKanbanProjectUsersQuery,
  GetKanbanQuery,
  ProjectModel,
  KanbanNode,
  Anatomy,
} from '@shared/api/generated'
import { projectQueries } from '@shared/api/queries/project'
import { PubSub } from '@shared/util'
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
        ...result.flatMap(({ id, projectName, assignees }) => [
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
        { assignees = [], projects = [] } = {},
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        let fetchQueue: { taskIds: string[]; projects: string[] }[] = []
        let fetchTimeout: any = null
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const processFetchQueue = async () => {
            const batch = [...fetchQueue]
            fetchQueue = []
            fetchTimeout = null

            const taskIds = Array.from(new Set(batch.flatMap((b) => b.taskIds)))
            const projects = Array.from(new Set(batch.flatMap((b) => b.projects)))

            if (taskIds.length === 0) return

            const tasks = await getKanbanTasks({ projects, taskIds }, dispatch)

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
                  // update the task
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

          const patchKanbanTask = ({
            projects = [],
            taskIds = [],
            payload,
          }: {
            projects: string[]
            taskIds: string[]
            payload?: Partial<KanbanNode>
          }) => {
            let needsFetch = false

            if (payload) {
              updateCachedData((draft) => {
                taskIds.forEach((id) => {
                  const index = draft.findIndex((t) => t.id === id)
                  if (index !== -1) {
                    // update the task
                    Object.assign(draft[index], payload)

                    // if assignees changed, check if it should be removed
                    if (payload.assignees) {
                      const isStillAssigned =
                        !assignees?.length || payload.assignees.some((a) => assignees?.includes(a))
                      if (!isStillAssigned) {
                        draft.splice(index, 1)
                      }
                    }
                  } else {
                    // task not in cache, if it's now assigned to us, we need to fetch
                    if (payload.assignees?.some((a) => assignees?.includes(a))) {
                      needsFetch = true
                    }
                  }
                })
              })
            } else {
              needsFetch = true
            }

            if (!needsFetch) return

            // add to queue
            fetchQueue.push({ projects, taskIds })

            // debounce the fetch with a random offset
            if (!fetchTimeout) {
              const delay = Math.random() * 5000
              fetchTimeout = setTimeout(processFetchQueue, delay)
            }
          }

          const handlePubSub = async (_topic: string, message: Message) => {
            const project = message.project
            // first check the project name as selected
            if (!projects?.includes(project)) return console.log('project not selected')
            // then get entity id
            const entityId = message.summary.entityId
            if (!entityId) return console.log('no entity id found')

            // current tasks on the board
            const cacheTasks = getCacheEntry().data ?? []
            // entity.task.status_changed
            const field = message.topic.split('.')[2].split('_changed')[0]

            // Only patch the task for the fields status and assignees.
            if (!['status', 'assignees'].includes(field)) return

            const value = message.summary.value
            // cast the correct type onto value based on the field
            let castValue: any = value
            if (field === 'status') {
              castValue = String(value)
            } else if (field === 'assignees') {
              castValue = Array.isArray(value) ? (value as string[]) : []
            }

            // check this task is actually on the board
            const isTaskOnMyBoard = cacheTasks.some((t) => t.id === entityId)
            // if the field is assignees AND the value includes current assignees then we patch
            const isValueMe =
              field === 'assignees' && (castValue as string[]).some((a) => assignees?.includes(a))

            if (!isTaskOnMyBoard && !isValueMe) return
            // patch task updates into kanban cache
            patchKanbanTask({
              taskIds: [entityId],
              projects: [project],
              payload: { [field]: castValue } as Partial<KanbanNode>,
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
        if (fetchTimeout) clearTimeout(fetchTimeout)
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
