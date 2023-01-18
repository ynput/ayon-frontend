import axios from 'axios'
import { toast } from 'react-toastify'

const loadBranch = async (query, projectName, parentId) => {
  const variables = { projectName, parent: parentId || 'root' }
  //console.log('Branch load', parentId)
  const response = await axios.post('/graphql', { query, variables })

  if (response.status !== 200) {
    toast.error(`Unable to load branch ${parentId}`)
    return {}
  }

  const data = response.data
  const nodes = {}

  console.log('loaded branch', data)

  // Add folders
  for (const edge of data.data.project.folders.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __parentId: parentId || 'root',
        __entityType: 'folder',
      },
      leaf: !(node.hasChildren || node.hasTasks),
    }
  }

  // Add tasks
  for (const edge of data.data.project.tasks.edges) {
    const node = edge.node
    nodes[node.id] = {
      data: {
        ...node,
        __parentId: parentId || 'root',
        __entityType: 'task',
      },
      leaf: true, // Tasks never have children
    }
  }

  return nodes
}

//
// Loading node data
//

const getUpdatedNodeData = async (
  nodeData,
  newNodes,
  expandedKeys,
  parents,
  query,
  projectName,
) => {
  // Load newly expanded branches
  for (const expandedKey of expandedKeys) {
    if (!(expandedKey in parents)) {
      const newNodes = await loadBranch(query, projectName, expandedKey)
      Object.assign(nodeData, newNodes)
    }
  }

  // Add unsaved nodes
  let newNodesIds = []
  for (const node of newNodes) {
    nodeData[node.id] = {
      data: node,
      leaf: true,
    }
    newNodesIds.push(node.id)
  }

  // Remove unsaved nodes which are deleted (via revert changes)
  for (const existingKey in nodeData) {
    if (!existingKey.startsWith('newnode')) continue
    if (!newNodesIds.includes(existingKey)) delete nodeData[existingKey]
  }

  // remove children from closed branches
  for (const existingKey in parents) {
    if (existingKey === 'root') continue
    if (!(existingKey in expandedKeys)) {
      for (const unusedKey in parents[existingKey]) {
        delete nodeData[unusedKey]
      }
    }
  }

  return { ...nodeData }
}

export { loadBranch, getUpdatedNodeData }
