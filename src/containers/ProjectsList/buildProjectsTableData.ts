import { ListProjectsItemModel, ProjectFolderModel } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import {
  buildHierarchicalTableRows,
  HierarchicalFolderNode,
} from '@shared/util'

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
  powerLicense: boolean = false,
): SimpleTableRow[] => {
  // If no folders, return simple project list
  const foldersMap = new Map<string, ProjectFolderModel>()
  for (const folder of folders) {
    foldersMap.set(String(folder.id), folder)
  }

  type FolderNode = HierarchicalFolderNode<ProjectFolderModel, ListProjectsItemModel>
  const folderNodes = new Map<string, FolderNode>()
  const rootFolderIds = new Set<string>()

  // Create all folder nodes first
  for (const folder of folders) {
    folderNodes.set(folder.id, {
      id: folder.id,
      folder,
      children: new Map(),
      items: [],
      hasAnyItems: false,
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
    const projectFolderId = project.projectFolder
    if (powerLicense && projectFolderId && foldersMap.has(projectFolderId)) {
      const folderNode = folderNodes.get(projectFolderId)!
      folderNode.items.push(project)
      folderNode.hasAnyItems = true
    } else {
      rootProjects.push(project)
    }
  }

  // Mark all parent folders that contain projects
  for (const node of folderNodes.values()) {
    if (node.hasAnyItems) {
      let currentFolder = node.folder
      while (currentFolder.parentId) {
        const parentNode = folderNodes.get(currentFolder.parentId)
        if (parentNode) {
          parentNode.hasAnyItems = true
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
  ): SimpleTableRow => ({
    id: project.name,
    name: project.name,
    label: project.name,
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

  // Build folder rows from the hierarchical structure using shared utility
  const folderRows = buildHierarchicalTableRows({
    folderNodes,
    rootFolderIds,
    showEmptyFolders,
    buildFolderRowId: buildProjectFolderRowId,
    createItemRow: createProjectRow,
    sortFolderNodes,
    getFolderLabel: (folder) => folder.label,
    getFolderIcon: (folder) => folder.data?.icon || FOLDER_ICON,
    getFolderColor: (folder) => folder.data?.color,
    getItemCount: (node) =>
      node.items.length +
      Array.from(node.children.values()).reduce((acc, child) => acc + child.items.length, 0),
  })

  // Create rows for root projects (projects not in folders)
  const rootProjectRows = rootProjects.map((project) => createProjectRow(project))

  // Combine: folder hierarchy first, then root projects
  return [...folderRows, ...rootProjectRows]
}

export default buildProjectsTableData
