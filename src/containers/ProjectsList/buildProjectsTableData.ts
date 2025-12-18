import { ListProjectsItemModel, ProjectFolderModel } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'

const FOLDER_ICON = 'folder'
export const PROJECT_FOLDER_ROW_ID_PREFIX = 'folder'
export const buildProjectFolderRowId = (folderId: string) =>
  `${PROJECT_FOLDER_ROW_ID_PREFIX}-${folderId}`
export const parseProjectFolderRowId = (rowId: string) => {
  if (!rowId || typeof rowId !== 'string') return null
  if (rowId.startsWith(PROJECT_FOLDER_ROW_ID_PREFIX + '-')) {
    return rowId.substring((PROJECT_FOLDER_ROW_ID_PREFIX + '-').length)
  }
  return null
}

const buildProjectsTableData = (
  projects: ListProjectsItemModel[] = [],
  folders: ProjectFolderModel[] = [],
  showEmptyFolders: boolean = true,
): SimpleTableRow[] => {
  // If no folders, return simple project list
  const foldersMap = new Map<string, ProjectFolderModel>()
  for (const folder of folders) {
    foldersMap.set(String(folder.id), folder)
  }
  interface FolderNode {
    id: string
    folder: ProjectFolderModel
    children: Map<string, FolderNode>
    projects: ListProjectsItemModel[]
    hasAnyProjects: boolean
  }
  const folderNodes = new Map<string, FolderNode>()
  const rootFolderIds = new Set<string>()

  // Create all folder nodes first
  for (const folder of folders) {
    folderNodes.set(folder.id, {
      id: folder.id,
      folder,
      children: new Map(),
      projects: [],
      hasAnyProjects: false,
    })

    // Track root folders (those without parentId)
    if (!folder.parentId) {
      rootFolderIds.add(folder.id)
    }
  }

  // Build parent-child relationships
  for (const folder of folders) {
    if (folder.parentId && folderNodes.has(folder.parentId)) {
      const parentNode = folderNodes.get(folder.parentId)!
      const childNode = folderNodes.get(folder.id)!
      parentNode.children.set(folder.id, childNode)
    }
  }

  // Assign projects to their folders
  const rootProjects: ListProjectsItemModel[] = []

  for (const project of projects) {
    // TODO: Once backend supports projectFolderId, use it here
    // For now, all projects go to root
    rootProjects.push(project)
  }

  // Mark all parent folders that contain projects
  for (const node of folderNodes.values()) {
    if (node.hasAnyProjects) {
      let currentFolder = node.folder
      while (currentFolder.parentId) {
        const parentNode = folderNodes.get(currentFolder.parentId)
        if (parentNode) {
          parentNode.hasAnyProjects = true
          currentFolder = parentNode.folder
        } else {
          break
        }
      }
    }
  }

  // Helper function to create project table row
  const createProjectRow = (
    project: ListProjectsItemModel,
    parents: string[] = [],
  ): SimpleTableRow => ({
    id: project.name,
    name: project.name,
    label: project.name,
    ...(parents.length > 0 && { parents }),
    inactive: !project.active,
    subRows: [],
    data: {
      id: project.name,
      active: project.active,
      code: project.code || project.name,
    },
  })

  // Helper function to sort folder nodes by position/original order
  const sortFolderNodes = (nodes: FolderNode[]): FolderNode[] => {
    return nodes.sort((a, b) => {
      // Sort by position if available
      if (a.folder.position !== undefined && b.folder.position !== undefined) {
        return a.folder.position - b.folder.position
      }
      // Otherwise sort by label
      return a.folder.label.localeCompare(b.folder.label)
    })
  }

  // Build table rows iteratively using depth-first traversal
  const buildTableRowsIteratively = (): SimpleTableRow[] => {
    const result: SimpleTableRow[] = []

    // Get root folders and sort them
    const rootNodes = Array.from(folderNodes.values()).filter(
      (node) => rootFolderIds.has(node.id) && (showEmptyFolders || node.hasAnyProjects),
    )
    const sortedRootNodes = sortFolderNodes(rootNodes)

    // Stack for iterative depth-first traversal
    type StackItem = {
      node: FolderNode
      targetArray: SimpleTableRow[]
      isProcessed: boolean
      parentPath: string[]
    }

    const stack: StackItem[] = []

    // Add root nodes to stack in reverse order
    for (let i = sortedRootNodes.length - 1; i >= 0; i--) {
      stack.push({
        node: sortedRootNodes[i],
        targetArray: result,
        isProcessed: false,
        parentPath: [],
      })
    }

    while (stack.length > 0) {
      const item = stack[stack.length - 1]

      if (item.isProcessed) {
        stack.pop()
        continue
      }

      item.isProcessed = true
      const { node, targetArray, parentPath } = item

      // Create folder row (don't include parents to avoid showing "/" separator)
      const folderRow: SimpleTableRow = {
        id: buildProjectFolderRowId(node.id),
        name: node.folder.label,
        label: node.folder.label,
        icon: node.folder.data?.icon || FOLDER_ICON,
        iconFilled: true,
        subRows: [],
        data: {
          id: node.id,
          isGroupRow: true,
          count:
            node.projects.length +
            Array.from(node.children.values()).reduce((acc, child) => acc + child.projects.length, 0),
          type: node.id,
          isFolder: true,
          color: node.folder.data?.color,
        },
      }

      // Add to target array
      targetArray.push(folderRow)

      // Add projects to this folder
      for (const project of node.projects) {
        folderRow.subRows.push(createProjectRow(project, [...parentPath, node.folder.label]))
      }

      // Get child folders and sort them
      const childNodes = Array.from(node.children.values()).filter(
        (child) => showEmptyFolders || child.hasAnyProjects,
      )
      const sortedChildNodes = sortFolderNodes(childNodes)

      // Add child folders to stack in reverse order
      for (let i = sortedChildNodes.length - 1; i >= 0; i--) {
        stack.push({
          node: sortedChildNodes[i],
          targetArray: folderRow.subRows,
          isProcessed: false,
          parentPath: [...parentPath, node.folder.label],
        })
      }
    }

    return result
  }

  // Build folder rows from the hierarchical structure
  const folderRows = buildTableRowsIteratively()

  // Create rows for root projects (projects not in folders)
  const rootProjectRows = rootProjects.map((project) => createProjectRow(project))

  // Combine: folder hierarchy first, then root projects
  return [...folderRows, ...rootProjectRows]
}

export default buildProjectsTableData
