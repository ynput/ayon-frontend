import { buildQuery } from '/src/pages/editor/queries'
import { ayonApi } from './ayon'

const FOLDERS_AND_TASKS_QUERY = `
  query FoldersAndTasks($projectName: String!, $parentIds: [String!]!, $folderIds: [String!]!, $taskNames: [String!]!) {
    project(name: $projectName) {
      folders(ids: $folderIds) {
        edges {
          node {
            id
            name
            folderType
            hasChildren
            hasTasks
            parents
            ownAttrib
            attrib {
              #FOLDER_ATTRS#
            }
          }
        }
      }
      tasks(folderIds: $parentIds, names: $taskNames) {
        edges {
          node {
            id
            name
            taskType
            ownAttrib
            attrib {
              #TASK_ATTRS#
            }
          }
        }
      }
    }
  }
`

const getFoldersAndTasks = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getFoldersAndTasks: build.query({
      query: ({ folderIds, parentIds, projectName, taskNames }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildQuery(FOLDERS_AND_TASKS_QUERY),
          variables: { folderIds, parentIds, projectName, taskNames },
        },
      }),
    }),
  }),
})

export const { useGetFoldersAndTasksQuery } = getFoldersAndTasks
