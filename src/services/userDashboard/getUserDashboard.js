import { ayonApi } from '../ayon'
import { taskProvideTags, transformTasksData } from './userDashboardHelpers'
import { KAN_BAN_TASK_QUERY, PROJECT_TASKS_QUERY } from './userDashboardQueries'
import PubSub from '/src/pubsub'

const getUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectTasks: build.query({
      query: ({ assignees = [], projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PROJECT_TASKS_QUERY,
          variables: { assignees, projectName },
        },
      }),
      transformResponse: (response) =>
        transformTasksData({
          projectName: response?.data?.project.projectName,
          tasks: response?.data?.project?.tasks?.edges?.map((edge) => edge.node),
        }),
      providesTags: taskProvideTags,
      async onCacheEntryAdded(
        { assignees = [], projectName },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = async (topic, message) => {
            // first check the project name
            if (message.project !== projectName) return
            // then get entity id
            const entityId = message.summary.entityId
            if (!entityId) return
            // then get the task data from the entity id
            const response = await dispatch(
              ayonApi.endpoints.getKanBanTask.initiate(
                { projectName, taskId: entityId },
                { forceRefetch: true },
              ),
            )

            if (response.status === 'rejected') throw new Error('No tasks found', entityId)

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
            // invalidate task to force refetch of getKanBan query
            // but because we just updated the tasks cache it should be instant
            dispatch(ayonApi.util.invalidateTags([{ type: 'kanBanTask', id: tagId }]))
          }

          // sub to websocket topic
          token = PubSub.subscribe('entity.task', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    }),
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

            if (response.status === 'rejected') throw new Error('No projects found', project)

            response.data.forEach((project) => projectTasks.push(project))
          }

          return { data: projectTasks }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      providesTags: (res) => taskProvideTags(res, 'kanBanTask'),
    }),
    getProjectsInfo: build.query({
      async queryFn({ projects = [], fields = [] }, { dispatch }) {
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

            if (response.status === 'rejected') throw new Error('No projects found', project)
            projectInfo[project] = {}
            for (const field of fields) {
              projectInfo[project][field] = response.data[field] || []
            }
          }

          return { data: projectInfo }
        } catch (error) {
          console.error(error)
          return error
        }
      },
    }),
    getKanBanTask: build.query({
      query: ({ taskId, projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: KAN_BAN_TASK_QUERY,
          variables: { taskId, projectName },
        },
      }),
      transformResponse: (response) =>
        transformTasksData({
          projectName: response?.data?.project?.projectName,
          tasks: [response?.data?.project?.task],
        }),
    }),
  }),
})

//

export const { useGetKanBanQuery, useGetProjectsInfoQuery } = getUserDashboard
