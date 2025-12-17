import { EntityList, EntityListFolderModel, EntityListModel } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'
import { FOLDER_ICON } from '../hooks/useListContextMenu'

export const LIST_FOLDER_ROW_ID_PREFIX = 'folder'
export const buildListFolderRowId = (folderId: string) => `${LIST_FOLDER_ROW_ID_PREFIX}-${folderId}`
export const parseListFolderRowId = (rowId: string) => {
  if (!rowId || typeof rowId !== 'string') return null
  if (rowId.startsWith(LIST_FOLDER_ROW_ID_PREFIX + '-')) {
    return rowId.substring((LIST_FOLDER_ROW_ID_PREFIX + '-').length)
  }
  return null
}

export const buildListsTableData = (
  listsData: EntityList[],
  folders: EntityListFolderModel[],
  showEmptyFolders: boolean = true,
  powerLicense: boolean = false,
  showArchived: boolean = false,
): SimpleTableRow[] => {
  // Create lookup maps
  const foldersMap = new Map<string, EntityListFolderModel>()
  for (const folder of folders) {
    foldersMap.set(String(folder.id), folder)
  }

  // Build hierarchical folder structure iteratively
  interface FolderNode {
    id: string
    folder: EntityListFolderModel
    children: Map<string, FolderNode>
    lists: EntityList[]
    hasAnyLists: boolean
  }

  const folderNodes = new Map<string, FolderNode>()
  const rootFolderIds = new Set<string>()

  // Create all folder nodes first
  for (const folder of folders) {
    folderNodes.set(folder.id, {
      id: folder.id,
      folder,
      children: new Map(),
      lists: [],
      hasAnyLists: false,
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

  // Filter out archived lists if showArchived is false
  const filteredLists = showArchived ? listsData : listsData.filter((list) => list.active)

  // Assign lists to their folders and mark folders as having lists
  const rootLists: EntityList[] = []

  for (const list of filteredLists) {
    const listFolderId = list.entityListFolderId

    if (powerLicense && listFolderId && folderNodes.has(listFolderId)) {
      const folderNode = folderNodes.get(listFolderId)!
      folderNode.lists.push(list)
      folderNode.hasAnyLists = true
    } else {
      rootLists.push(list)
    }
  }

  // Mark all parent folders that contain lists (directly or indirectly)
  for (const node of folderNodes.values()) {
    if (node.hasAnyLists) {
      // Find all parent paths and mark them
      let currentFolder = node.folder
      while (currentFolder.parentId) {
        const parentNode = folderNodes.get(currentFolder.parentId)
        if (parentNode) {
          parentNode.hasAnyLists = true
          currentFolder = parentNode.folder
        } else {
          break
        }
      }
    }
  }

  // Helper function to sort lists
  const sortLists = (lists: EntityList[]): EntityList[] => {
    return [...lists].sort((a, b) => {
      // Active lists come first
      if (a.active && !b.active) return -1
      if (!a.active && b.active) return 1

      // Both active or both inactive: sort by createdAt (newest first)
      const aDate = new Date(a.createdAt || 0)
      const bDate = new Date(b.createdAt || 0)
      return bDate.getTime() - aDate.getTime()
    })
  }

  // Helper function to create list table row
  const createListRow = (
    list: EntityList,
    parentType?: string,
    parents: string[] = [],
  ): SimpleTableRow => ({
    id: list.id,
    name: list.label,
    label: list.label,
    ...(parents.length > 0 && { parents }),
    icon: getListIcon(list),
    inactive: !list.active,
    subRows: [],
    data: {
      id: list.id,
      count: list.count,
      owner: list.owner,
      entityListType: list.entityListType,
      createdAt: list.createdAt,
      ...(parentType && { parentType }),
    },
  })

  // Helper function to sort folder nodes by original folders array order
  const sortFolderNodes = (nodes: FolderNode[]): FolderNode[] => {
    return nodes.sort((a, b) => {
      const aIndex = folders.findIndex((folder) => folder.id === a.id)
      const bIndex = folders.findIndex((folder) => folder.id === b.id)

      if (aIndex === -1 && bIndex === -1) return a.folder.label.localeCompare(b.folder.label)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1

      return aIndex - bIndex
    })
  }

  // Build table rows iteratively using depth-first traversal
  const buildTableRowsIteratively = (): SimpleTableRow[] => {
    const result: SimpleTableRow[] = []

    // Get root folders that have lists and sort them
    const rootNodes = Array.from(folderNodes.values()).filter(
      (node) => rootFolderIds.has(node.id) && (showEmptyFolders || node.hasAnyLists),
    )
    const sortedRootNodes = sortFolderNodes(rootNodes)

    // Stack for iterative depth-first traversal: [node, targetArray, processed]
    type StackItem = {
      node: FolderNode
      targetArray: SimpleTableRow[]
      isProcessed: boolean
      parentPath: string[]
    }

    const stack: StackItem[] = []

    // Add root nodes to stack in reverse order (so first item is processed first)
    for (let i = sortedRootNodes.length - 1; i >= 0; i--) {
      stack.push({
        node: sortedRootNodes[i],
        targetArray: result,
        isProcessed: false,
        parentPath: [],
      })
    }

    while (stack.length > 0) {
      const item = stack[stack.length - 1] // Peek at top

      if (item.isProcessed) {
        // This node has been processed, remove from stack
        stack.pop()
        continue
      }

      // Mark as processed to avoid infinite loops
      item.isProcessed = true
      const { node, targetArray, parentPath } = item

      // Create folder row
      const folderRow: SimpleTableRow = {
        id: buildListFolderRowId(node.id),
        name: node.folder.label,
        label: node.folder.label,
        ...(parentPath.length > 0 && { parents: parentPath }),
        icon: node.folder.data?.icon || FOLDER_ICON,
        iconFilled: true,
        subRows: [],
        data: {
          id: node.id,
          isGroupRow: true,
          count:
            node.lists.length +
            Array.from(node.children.values()).reduce((acc, child) => acc + child.lists.length, 0),
          type: node.id,
          isFolder: true,
          color: node.folder.data?.color,
        },
      }

      // Add to target array
      targetArray.push(folderRow)

      // Add sorted lists to this folder
      const sortedLists = sortLists(node.lists)
      for (const list of sortedLists) {
        folderRow.subRows.push(createListRow(list, node.id, [...parentPath, node.folder.label]))
      }

      // Get child folders that have lists and sort them
      const childNodes = Array.from(node.children.values()).filter(
        (child) => showEmptyFolders || child.hasAnyLists,
      )
      const sortedChildNodes = sortFolderNodes(childNodes)

      // Add child folders to stack in reverse order (for correct processing order)
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
  const folderRows = powerLicense ? buildTableRowsIteratively() : []

  // Sort root lists: active first (by createdAt newest first), then inactive (by createdAt newest first)
  const sortedRootLists = sortLists(rootLists)
  const rootListRows = sortedRootLists.map((list) => createListRow(list))

  // Combine in the specified order: folder hierarchy first, then root lists
  return [...folderRows, ...rootListRows]
}

export const getListIcon = (list: Pick<EntityListModel, 'entityListType' | 'entityType'>) =>
  list.entityListType === 'review-session' ? 'subscriptions' : getEntityTypeIcon(list.entityType)
