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
  }),
})

//

export const { useGetKanBanQuery } = getUserDashboard
