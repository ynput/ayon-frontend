import { ayonApi } from './ayon'

const WORKFILES_QUERY = `
query WorkfilesByTask($projectName: String!, $taskIds: [String!]!) {
  project(name: $projectName) {
    workfiles(taskIds:$taskIds) {
      edges {
        node {
          id
          taskId
          name
          path
        }
      }
    }
  }
}
`

const getWorkfileList = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getWorkfileList: build.query({
      query: ({ projectName, taskIds }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: WORKFILES_QUERY,
          variables: { projectName, taskIds },
        },
      }),
      transformResponse: (response) =>
        response.data.project.workfiles.edges.map((edge) => ({
          id: edge.node.id,
          taskId: edge.node.taskId,
          name: edge.node.name,
          path: edge.node.path,
        })),
      transformErrorResponse: (error) => error.data?.detail || `Error ${error.status}`,
    }),
  }),
})

export const { useGetWorkfileListQuery } = getWorkfileList
