import parseTasksList from '@//helpers/parseTasksList'
import api from '@api'

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

const getTasks = api.injectEndpoints({
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
  overrideExisting: true,
})

export const { useGetTasksQuery } = getTasks
