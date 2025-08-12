// takes folder ids and a folder tree table and returns the expanded folders to show the ids

import { FolderListItem } from '@shared/api'

export const getExpandedFoldersFromIds = (
  folderIds: string[],
  foldersData: FolderListItem[],
): Record<string, boolean> => {
  if (!folderIds.length || !foldersData.length) {
    return {}
  }

  // Create a Map for O(1) lookup of folders by ID
  const folderMap = new Map<string, FolderListItem>()
  for (const folder of foldersData) {
    folderMap.set(folder.id, folder)
  }

  // Set to track all parent IDs that need to be expanded (prevents duplicates)
  const expandedParents = new Set<string>()

  // For each selected folder, traverse up the hierarchy to collect all parent IDs
  for (const folderId of folderIds) {
    let currentFolder = folderMap.get(folderId)

    // Traverse up the parent chain
    while (currentFolder?.parentId) {
      // Add parent to expanded set
      expandedParents.add(currentFolder.parentId)
      // Move to the next parent
      currentFolder = folderMap.get(currentFolder.parentId)
    }
  }

  // Convert Set to object format expected by table (Record<string, boolean>)
  const result: Record<string, boolean> = {}
  for (const parentId of expandedParents) {
    result[parentId] = true
  }

  return result
}
