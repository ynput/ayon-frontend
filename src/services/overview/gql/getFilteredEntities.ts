import api from '@api'

/*
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
*/

const getFilteredEntities = api.injectEndpoints({
  endpoints: (build) => ({
  }),
  overrideExisting: true,
})

export const { useGetFilteredEntitiesQuery } = getFilteredEntities
