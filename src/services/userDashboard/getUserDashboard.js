import { ayonApi } from '../ayon'
import { KAN_BAN_QUERY } from './userDashboardQueries'

const getUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getKanBan: build.query({
      query: ({ assignees = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: KAN_BAN_QUERY,
          variables: { assignees },
        },
      }),
      transformResponse: (response) =>
        response?.data?.projects?.edges.flatMap(({ node }) => {
          return node.tasks.edges.map(({ node: task }) => {
            return {
              id: task.id,
              name: task.name,
              status: task.status,
              taskType: task.taskType,
              assignees: task.assignees,
              folderName: task.folder?.name,
              folderId: task.folderId,
              path: task.folder?.path,
              projectName: node.projectName,
            }
          })
        }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'task', id })), { type: 'task', id: 'TASKS' }]
          : [{ type: 'task', id: 'TASKS' }],
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

            if (response.status === 'rejected') throw new Error('No projects found', project)
            projectInfo[project] = { statuses: response?.data?.statuses }
          }

          return { data: projectInfo }
        } catch (error) {
          console.error(error)
          return error
        }
      },
    }),
  }),
})

//

export const { useGetKanBanQuery, useGetProjectsInfoQuery } = getUserDashboard
