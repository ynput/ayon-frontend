import type { ExpandedState } from '@tanstack/react-table'
import type { EntityListFolderModel } from '@shared/api'
import { buildListFolderRowId, parseListFolderRowId } from './buildListsTableData'

interface SelectAllListsArgs<T extends { id: string; entityListFolderId?: string | null }> {
  rowIds: string[] // the selected rows: lists and folders
  lists: T[]
  folders: EntityListFolderModel[]
  expanded: ExpandedState
  disabledListIds: Set<string>
}

// The lists "Select all lists" selects: with folders selected, the lists in them and their
// subfolders whose folders are all expanded (the lists on screen); otherwise the root lists.
// Lists that can't be picked are skipped.
export const getListsToSelectAll = <T extends { id: string; entityListFolderId?: string | null }>({
  rowIds,
  lists,
  folders,
  expanded,
  disabledListIds,
}: SelectAllListsArgs<T>): T[] => {
  const selectedFolderIds = rowIds
    .map((id) => parseListFolderRowId(id))
    .filter((id): id is string => !!id)

  if (!selectedFolderIds.length) {
    // No folders selected: select all root lists (lists without folder)
    return lists.filter((l) => !l.entityListFolderId && !disabledListIds.has(l.id))
  }

  // BFS to collect descendant folder ids
  const queue = [...selectedFolderIds]
  const allFolderIds = new Set(selectedFolderIds)
  while (queue.length) {
    const current = queue.shift()!
    for (const child of folders) {
      if (child.parentId === current && !allFolderIds.has(child.id)) {
        allFolderIds.add(child.id)
        queue.push(child.id)
      }
    }
  }

  // Build a map for quick parent lookup
  const folderMap = new Map(folders.map((f) => [f.id, f]))

  // Helper to check if the full ancestor chain is expanded
  const isFolderChainExpanded = (folderId: string): boolean => {
    let currentId: string | undefined = folderId
    while (currentId) {
      if (!(expanded as Record<string, boolean>)[buildListFolderRowId(currentId)]) return false
      currentId = folderMap.get(currentId)?.parentId ?? undefined
    }
    return true
  }

  return lists.filter((l) => {
    if (disabledListIds.has(l.id)) return false
    if (!l.entityListFolderId) return false
    if (!allFolderIds.has(l.entityListFolderId)) return false
    return isFolderChainExpanded(l.entityListFolderId)
  })
}
