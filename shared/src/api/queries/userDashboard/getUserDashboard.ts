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
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
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

          const handlePubSub = async (_topic: string, message: any) => {
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
}

export type ProjectModeWithAnatomy = ProjectModel & { anatomy?: Anatomy }

export type GetProjectsInfoResponse = { [projectName: string]: ProjectModeWithAnatomy | undefined }

const injectedDashboardRestApi = enhancedDashboardGraphqlApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsInfo: build.query<GetProjectsInfoResponse, GetProjectsInfoParams>({
      async queryFn({ projects = [] }, { dispatch }) {
        try {
          // get project info for each project
          const projectInfo: Record<string, ProjectModeWithAnatomy | undefined> = {}
          for (const project of projects) {
            const projectName = project as string
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            const responses = [
              dispatch(
                projectQueries.endpoints.getProject.initiate(
                  { projectName },
                  { forceRefetch: true },
                ),
              ).unwrap(),
              dispatch(
                projectQueries.endpoints.getProjectAnatomy.initiate(
                  { projectName },
                  { forceRefetch: true },
                ),
              ).unwrap(),
            ]

            const response = await Promise.all(responses)

            const projectData = response[0] as ProjectModel | undefined
            const anatomyData = response[1] as Anatomy | undefined

            if (projectData) {
              projectInfo[projectName] = { ...projectData, anatomy: anatomyData }
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
