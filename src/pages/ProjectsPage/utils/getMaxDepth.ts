import { GROUP_BY_FOLDER_KEY } from '../constants'
import { FolderMap } from '../hooks'

export const getMaxDepth = (foldersMap: FolderMap, grouping: string[]) => {
  if (!grouping.length) return 0

  if (!grouping.includes(GROUP_BY_FOLDER_KEY)) {
    // Each non-folder grouping level adds 1 depth
    return grouping.length
  }

  // Compute the maximum folder nesting depth from foldersMap
  const depthCache = new Map<string, number>()
  const getFolderDepth = (folderId: string): number => {
    if (depthCache.has(folderId)) return depthCache.get(folderId)!
    const folder = foldersMap.get(folderId)
    if (!folder || !folder.parentId) {
      depthCache.set(folderId, 0)
      return 0
    }
    const depth = 1 + getFolderDepth(folder.parentId)
    depthCache.set(folderId, depth)
    return depth
  }

  let maxFolderDepth = 0
  for (const folderId of foldersMap.keys()) {
    maxFolderDepth = Math.max(maxFolderDepth, getFolderDepth(folderId))
  }

  // Project rows sit one level below the deepest folder group,
  // plus any additional non-folder grouping levels
  const otherGroupings = grouping.filter((g) => g !== GROUP_BY_FOLDER_KEY).length
  return maxFolderDepth + 1 + otherGroupings
}
