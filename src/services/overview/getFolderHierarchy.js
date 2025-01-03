import api from '@api'
import query from '@queries/overview/gql/queries/getFolderHierarhyQuery'

const transformEditorData = (project) => {
  const nodes = {}

  if (!project) return {}

  // Add folders
  for (const edge of project.folders.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __parentId: node.parentId || 'root',
        __entityType: 'folder',
      },
      leaf: false,
    }
  }

  // Add tasks
  for (const edge of project.tasks.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __parentId: node.folderId || 'root',
        __entityType: 'task',
      },
      leaf: true, // Tasks never have children
    }
  }

  return nodes
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFolderHierarchy: build.query({
      query: ({ projectName, parentId }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: query(),
          variables: { projectName, parents: parentId },
        },
      }),
      transformResponse: (response) => transformEditorData(response.data?.project),
      providesTags: (res, error, { parentId }) => [{ type: 'branch', id: parentId }],
      async onCacheEntryAdded(args, { cacheDataLoaded }) {
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded


        } catch (error) {
          console.error(error)
        }
      },
    }),
  }),
  overrideExisting: true,
})

export const { useGetFolderHierarchyQuery } = extendedApi
