import { buildQuery } from '/src/pages/editor/queries'
import { ayonApi } from './ayon'

const FOLDERS_AND_TASKS_QUERY = `
  query FoldersAndTasks($projectName: String!, $parentIds: [String!]!, $folderIds: [String!]!, $taskNames: [String!]!, $taskFolderIds: [String!]!) {
    project(name: $projectName) {
      folders(ids: $folderIds, parentIds: $parentIds) {
        edges {
          node {
            id
            name
            folderType
            hasChildren
            hasTasks
            parents
            ownAttrib
            parentId
            attrib {
              #FOLDER_ATTRS#
            }
          }
        }
      }
      tasks(folderIds: $taskFolderIds, names: $taskNames) {
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

const formatFoldersAndTasks = (data) => {
  const nodes = {}

  console.log('loaded branch', data)
  if (!data) return null

  // Add folders
  for (const edge of data.project.folders.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __entityType: 'folder',
        __parentId: node.parentId || 'root',
      },
      leaf: !(node.hasChildren || node.hasTasks),
    }
  }

  // Add tasks
  for (const edge of data.project.tasks.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __entityType: 'task',
        // __parentId: parentId || 'root',
      },
      leaf: true, // Tasks never have children
    }
  }

  return nodes
}

const getFoldersAndTasks = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getFoldersAndTasks: build.query({
      query: ({ folderIds, parentIds, projectName, taskNames, taskFolderIds = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildQuery(FOLDERS_AND_TASKS_QUERY),
          variables: { folderIds, parentIds, projectName, taskNames, taskFolderIds },
        },
      }),
      transformResponse: (res) => formatFoldersAndTasks(res.data),
    }),
  }),
})

export const { useGetFoldersAndTasksQuery } = getFoldersAndTasks
