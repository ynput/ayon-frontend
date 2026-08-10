import { EntityListFolderModel } from '@shared/api'

// true when moving folderId under targetParentId would nest the folder inside itself
export const wouldCreateCircularDependency = (
  folderId: string,
  targetParentId: string,
  folders: EntityListFolderModel[],
): boolean => {
  if (folderId === targetParentId) return true

  const folderMap = new Map(folders.map((f) => [f.id, f]))

  // Check if targetParentId is a descendant of folderId
  const isDescendant = (currentId: string, ancestorId: string): boolean => {
    const current = folderMap.get(currentId)
    if (!current || !current.parentId) return false
    if (current.parentId === ancestorId) return true
    return isDescendant(current.parentId, ancestorId)
  }

  return isDescendant(targetParentId, folderId)
}
