import type { EntityListFolderModel } from '@shared/api'
import { isFolderInScope } from '@shared/containers/ListPicker/util/listFolders'

export { isFolderInScope, getNewListFolderId } from '@shared/containers/ListPicker/util/listFolders'

export type FolderMap = Map<string, EntityListFolderModel>

export const buildFolderMap = (folders: EntityListFolderModel[]): FolderMap =>
  new Map(folders.map((f) => [f.id, f]))

// true when moving folderId under targetParentId would nest the folder inside itself
export const wouldCreateCircularDependency = (
  folderId: string,
  targetParentId: string,
  folders: EntityListFolderModel[] | FolderMap,
): boolean => {
  if (folderId === targetParentId) return true

  const folderMap = folders instanceof Map ? folders : buildFolderMap(folders)

  // Check if targetParentId is a descendant of folderId
  const isDescendant = (currentId: string, ancestorId: string): boolean => {
    const current = folderMap.get(currentId)
    if (!current || !current.parentId) return false
    if (current.parentId === ancestorId) return true
    return isDescendant(current.parentId, ancestorId)
  }

  return isDescendant(targetParentId, folderId)
}

// "Parent / Child" label, for places that show folders flat instead of as a tree
export const getFolderPath = (folderId: string, folderMap: FolderMap): string => {
  const labels: string[] = []
  const visited = new Set<string>()
  let current = folderMap.get(folderId)
  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    labels.unshift(current.label)
    current = current.parentId ? folderMap.get(current.parentId) : undefined
  }
  return labels.join(' / ')
}

export type ListFolderOption = { value: string; label: string; icon: string }

// dropdown options for the folders a new list can go in, sorted by path
export const buildListFolderOptions = (
  folders: EntityListFolderModel[],
  isReview?: boolean,
): ListFolderOption[] => {
  const folderMap = buildFolderMap(folders)
  return folders
    .filter((folder) => isFolderInScope(folder, [isReview ? 'review-session' : 'generic']))
    .map((folder) => ({
      value: folder.id,
      label: getFolderPath(folder.id, folderMap),
      icon: folder.data?.icon || 'folder',
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
