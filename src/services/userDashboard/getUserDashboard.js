import { isEqual } from 'lodash'
import { ayonApi } from '../ayon'
import { taskProvideTags, transformEntityData, transformTasksData } from './userDashboardHelpers'
import {
  KAN_BAN_ASSIGNEES_QUERY,
  TASK_MENTION_TASKS,
  TASK_DETAILS,
  PROJECT_TASKS_QUERY,
  buildDetailsQuery,
} from './userDashboardQueries'
import PubSub from '/src/pubsub'

const getUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // called by getKanBan only
    getProjectTasks: build.query({
      query: ({ assignees = [], projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PROJECT_TASKS_QUERY(['endDate']),
          variables: { assignees, projectName },
        },
      }),
      transformResponse: (response) =>
        response?.errors?.length
          ? { errors: response?.errors }
          : transformTasksData({
              projectName: response?.data?.project.projectName,
              code: response?.data?.project.code,
              tasks: response?.data?.project?.tasks?.edges?.map((edge) => edge.node),
            }),
      providesTags: taskProvideTags,
      async onCacheEntryAdded(
        { assignees = [], projectName },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getState },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = async (topic, message) => {
            let currentAssignees = getState().dashboard.tasks.assignees
            const assigneesIsMe = getState().dashboard.tasks.assigneesIsMe
            // currentAssignees state will be empty if assigneesIsMe is true
            // so we need to get me user
            if (assigneesIsMe) currentAssignees = [getState().user.name]
            const isSameAssignees = isEqual(currentAssignees, assignees)

            // first check the project name
            if (message.project !== projectName) return
            // then get entity id
            const entityId = message.summary.entityId
            if (!entityId) return
            // then get the task data from the entity id
            const response = await dispatch(
              ayonApi.endpoints.getKanBanTask.initiate(
                { projectName, entityId },
                { forceRefetch: true },
              ),
            )

            if (response.status === 'rejected') {
              console.error('No tasks found', entityId)
              throw new Error('No tasks found', entityId)
            }

            // get task from response
            const task = response.data[0]

            if (!task) return

            // update the task in the cache
            let tagId = task.id
            updateCachedData((draft) => {
              // check to see if assignees are still on the task
              const assigneesOnTask = task.assignees.filter((assignee) =>
                assignees.includes(assignee),
              )
              const isStillOnTask = assigneesOnTask.length > 0
              if (!isStillOnTask) {
                // remove from cache
                const index = draft.findIndex((t) => t.id === task.id)
                if (index !== -1) {
                  console.log('removing task')
                  draft.splice(index, 1)
                }
              } else {
                // check to see if task is already in cache
                const index = draft.findIndex((t) => t.id === task.id)
                if (index === -1) {
                  console.log('adding task')
                  const newTasks = [...draft, task]
                  // add to cache
                  Object.assign(draft, newTasks)
                  tagId = 'TASKS'
                } else {
                  console.log('updating task')
                  // replace in cache
                  draft[index] = task
                }
              }
            })

            // check to see if this query is the query we are currently using (has same assignees)
            if (!isSameAssignees) return
            // invalidate task to force refetch of getKanBan query
            // but because we just updated the tasks cache it should be instant
            dispatch(ayonApi.util.invalidateTags([{ type: 'kanBanTask', id: tagId }]))
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
    }),
    // main query to get all kanban tasks
    getKanBan: build.query({
      async queryFn({ projects = [], assignees = [] }, { dispatch }) {
        console.log('fetching kanban')

        try {
          // get project tasks for each project
          const projectTasks = []
          for (const project of projects) {
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            // it also allows to update the project tasks from websocket in the background
            const response = await dispatch(
              ayonApi.endpoints.getProjectTasks.initiate(
                { projectName: project, assignees },
                { forceRefetch: false },
              ),
            )

            if (response?.data?.errors?.length) {
              console.error('ERROR: getKanBan Query:' + response?.data?.errors)
              const message = response?.data?.errors[0]?.message
              throw message || 'No projects found'
            }

            response.data.forEach((project) => projectTasks.push(project))
          }

          return { data: projectTasks }
        } catch (error) {
          return { error: error }
        }
      },
      providesTags: (res) => taskProvideTags(res, 'kanBanTask'),
    }),
    getProjectsInfo: build.query({
      async queryFn({ projects = [] }, { dispatch }) {
        try {
          // get project info for each project
          const projectInfo = {}
          for (const project of projects) {
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            const response = await dispatch(
              ayonApi.endpoints.getProjectAnatomy.initiate(
                { projectName: project },
                { forceRefetch: false },
              ),
            )

            if (response.status === 'rejected') {
              throw 'No projects found'
            }
            projectInfo[project] = response.data
          }

          return { data: projectInfo }
        } catch (error) {
          console.error(error)
          return { error }
        }
      },
    }),
    getKanBanTask: build.query({
      query: ({ entityId, projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: TASK_DETAILS(['endDate']),
          variables: { entityId, projectName },
        },
      }),
      transformResponse: (response) =>
        transformTasksData({
          projectName: response?.data?.project?.projectName,
          code: response?.data?.project?.code,
          tasks: [response?.data?.project?.task],
        }),
    }),
    getKanBanAssignee: build.query({
      query: ({ projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: KAN_BAN_ASSIGNEES_QUERY,
          variables: { projectName },
        },
      }),
      transformResponse: (res) =>
        res?.data?.users.edges.flatMap((u) => {
          if (!u.node) return []

          const n = u.node

          return {
            name: n.name,
            fullName: n.attrib?.fullName,
            avatarUrl: `/api/users/${n.name}/avatar`,
          }
        }),
    }),
    getKanBanUsers: build.query({
      async queryFn({ projects = [] }, { dispatch }) {
        try {
          // get users for each project
          const assignees = []
          const usersOnProjects = {}
          for (const project of projects) {
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            const response = await dispatch(
              ayonApi.endpoints.getKanBanAssignee.initiate(
                { projectName: project },
                { forceRefetch: false },
              ),
            )

            if (response.status === 'rejected') {
              console.error('no projects found', project)
              throw new Error('No projects found', project)
            }
            response.data.forEach((assignee) => {
              const existingAssignee = assignees.find((a) => a.name === assignee.name)
              if (existingAssignee) {
                existingAssignee.projects.push(project)
              } else {
                assignees.push({
                  ...assignee,
                  avatarUrl: `/api/users/${assignee.name}/avatar`,
                  projects: [project],
                })
              }
            })

            usersOnProjects[project] = response.data.map((a) => a.name)
          }

          return { data: assignees }
        } catch (error) {
          console.error(error)
          return error
        }
      },
    }),
    // TODO, move to separate file getEntityPanel
    getDashboardEntityDetails: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildDetailsQuery(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (response, meta, { entityType, projectName, projectInfo }) =>
        transformEntityData({
          projectName: projectName,
          entity: response?.data?.project && response?.data?.project[entityType],
          entityType,
          projectInfo,
        }),
      serializeQueryArgs: ({ queryArgs: { projectName, entityId, entityType } }) => ({
        projectName,
        entityId,
        entityType,
      }),
      providesTags: (res, error, { entityId, entityType }) =>
        res
          ? [
              { type: entityType, id: entityId },
              { type: entityType, id: 'LIST' },
            ]
          : [{ type: entityType, id: 'LIST' }],
    }),
    getDashboardEntitiesDetails: build.query({
      async queryFn({ entities = [], entityType, projectsInfo = {} }, { dispatch }) {
        try {
          const promises = entities.map((entity) =>
            dispatch(
              ayonApi.endpoints.getDashboardEntityDetails.initiate(
                {
                  projectName: entity.projectName,
                  entityId: entity.id,
                  entityType,
                  projectInfo: projectsInfo[entity.projectName],
                },
                { forceRefetch: false },
              ),
            ),
          )

          const res = await Promise.all(promises)

          const entitiesDetails = []
          for (const response of res) {
            if (response.status === 'rejected') {
              console.error('No entity found')
              continue
            }

            entitiesDetails.push(response.data)
          }

          return { data: entitiesDetails }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      serializeQueryArgs: ({ queryArgs: { entities, entityType } }) => ({
        entities,
        entityType,
      }),
      providesTags: (res, error, { entities }) =>
        entities.map(({ id }) => ({ id, type: 'entities' })),
    }),
    getTaskMentionTasks: build.query({
      query: ({ projectName, folderIds = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: TASK_MENTION_TASKS,
          variables: { projectName, folderIds },
        },
      }),
      transformResponse: (response) =>
        response?.data?.project?.folders?.edges?.flatMap(
          (ef) =>
            ef?.node?.tasks?.edges.map((et) => ({
              ...et?.node,
              label: et?.node?.label || et?.node?.name,
              folderId: ef?.node?.id,
              folderLabel: ef?.node?.label || ef?.node?.name,
            })) || [],
        ),
      providesTags: (res) =>
        res && res.map(({ id }) => ({ type: 'kanBanTask', id }, { type: 'task', id })),
    }),
  }),
})

//

export const {
  useGetKanBanQuery,
  useGetProjectsInfoQuery,
  useGetKanBanUsersQuery,
  useGetDashboardEntitiesDetailsQuery,
  useLazyGetDashboardEntitiesDetailsQuery,
  useGetTaskMentionTasksQuery,
} = getUserDashboard
