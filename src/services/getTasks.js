import parseTasksList from '/src//helpers/parseTasksList'
import { ayonApi } from './ayon'

const TASKS_QUERY = `
query TasksByFolder($projectName: String!, $folderIds: [String!]!) {
  project(name: $projectName) {
    tasks(folderIds:$folderIds) {
      edges {
        node {
          id
          name
          label
          taskType
          assignees
          active
          folder {
            name
            label
            parents
            path
          }
        }
      }
    }
  }
}
`

const getTasks = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.query({
      query: ({ projectName, folderIds }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: TASKS_QUERY,
          variables: { projectName, folderIds },
        },
      }),
      transformResponse: (response, meta, { userName }) =>
        parseTasksList(response.data?.project?.tasks?.edges, userName),
      transformErrorResponse: (error) => error.data?.detail || `Error ${error.status}`,
      providesTags: ['project'],
    }),
  }),
})

export const { useGetTasksQuery } = getTasks
