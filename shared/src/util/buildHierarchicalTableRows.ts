import { SimpleTableRow } from '@shared/containers/SimpleTable'

/**
 * Generic folder node structure for hierarchical data
 */
export interface HierarchicalFolderNode<TFolder, TItem> {
  id: string
  folder: TFolder
  children: Map<string, HierarchicalFolderNode<TFolder, TItem>>
  items: TItem[]
  hasAnyItems: boolean
}

/**
 * Configuration for building hierarchical table rows
 */
export interface BuildHierarchicalRowsConfig<TFolder, TItem> {
  /** Map of folder nodes */
  folderNodes: Map<string, HierarchicalFolderNode<TFolder, TItem>>
  /** Set of root folder IDs */
  rootFolderIds: Set<string>
  /** Whether to show empty folders */
  showEmptyFolders: boolean
  /** Function to build row ID from folder ID */
  buildFolderRowId: (folderId: string) => string
  /** Function to create a table row for an item */
  createItemRow: (item: TItem, parentId?: string, parentPath?: string[]) => SimpleTableRow
  /** Function to sort folder nodes */
  sortFolderNodes: (nodes: HierarchicalFolderNode<TFolder, TItem>[]) => HierarchicalFolderNode<TFolder, TItem>[]
  /** Function to sort items within a folder */
  sortItems?: (items: TItem[]) => TItem[]
  /** Function to extract folder label */
  getFolderLabel: (folder: TFolder) => string
  /** Function to extract folder icon */
  getFolderIcon: (folder: TFolder) => string
  /** Function to extract folder color */
  getFolderColor: (folder: TFolder) => string | undefined
  /** Function to get item count for display */
  getItemCount: (node: HierarchicalFolderNode<TFolder, TItem>) => number
}

/**
 * Builds table rows iteratively using depth-first traversal from a hierarchical folder structure.
 * This is a generic function that can be used for both projects and lists or any other hierarchical data.
 */
export const buildHierarchicalTableRows = <TFolder, TItem>(
  config: BuildHierarchicalRowsConfig<TFolder, TItem>,
): SimpleTableRow[] => {
  const {
    folderNodes,
    rootFolderIds,
    showEmptyFolders,
    buildFolderRowId,
    createItemRow,
    sortFolderNodes,
    sortItems,
    getFolderLabel,
    getFolderIcon,
    getFolderColor,
    getItemCount,
  } = config

  const result: SimpleTableRow[] = []

  // Get root folders and sort them
  const rootNodes = Array.from(folderNodes.values()).filter(
    (node) => rootFolderIds.has(node.id) && (showEmptyFolders || node.hasAnyItems),
  )
  const sortedRootNodes = sortFolderNodes(rootNodes)

  // Stack for iterative depth-first traversal
  type StackItem = {
    node: HierarchicalFolderNode<TFolder, TItem>
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

    const folderLabel = getFolderLabel(node.folder)
    const folderColor = getFolderColor(node.folder)

    // Create folder row
    const folderRow: SimpleTableRow = {
      id: buildFolderRowId(node.id),
      name: folderLabel,
      label: folderLabel,
      ...(parentPath.length > 0 && { parents: parentPath }),
      icon: getFolderIcon(node.folder),
      iconColor: folderColor,
      iconFilled: true,
      subRows: [],
      data: {
        id: node.id,
        isGroupRow: true,
        count: getItemCount(node),
        type: node.id,
        isFolder: true,
        color: folderColor,
      },
    }

    // Add to target array
    targetArray.push(folderRow)

    // Add items to this folder (sorted if sort function provided)
    const itemsToAdd = sortItems ? sortItems(node.items) : node.items
    for (const item of itemsToAdd) {
      folderRow.subRows.push(createItemRow(item, node.id, [...parentPath, folderLabel]))
    }

    // Get child folders and sort them
    const childNodes = Array.from(node.children.values()).filter(
      (child) => showEmptyFolders || child.hasAnyItems,
    )
    const sortedChildNodes = sortFolderNodes(childNodes)

    // Add child folders to stack in reverse order (for correct processing order)
    for (let i = sortedChildNodes.length - 1; i >= 0; i--) {
      stack.push({
        node: sortedChildNodes[i],
        targetArray: folderRow.subRows,
        isProcessed: false,
        parentPath: [...parentPath, folderLabel],
      })
    }
  }

  return result
}