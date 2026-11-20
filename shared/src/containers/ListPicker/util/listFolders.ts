import type { EntityList, EntityListFolderModel } from '@shared/api'

// Folders are scoped by list type: a folder without a scope holds every type, a folder whose scope
// has 'review-session' holds review sessions, any other folder holds generic lists. A table shows
// the folders of the list types it shows (no types: every folder).
export const isFolderInScope = (
  folder: EntityListFolderModel,
  entityListTypes?: string[],
): boolean => {
  const scope = folder.data?.scope
  if (!scope || scope.length === 0 || !entityListTypes?.length) return true
  const folderListType = scope.includes('review-session') ? 'review-session' : 'generic'
  return entityListTypes.includes(folderListType)
}

// folder a new list starts in: the first selected folder, else the folder of the first selected list
export const getNewListFolderId = (
  selectedFolderIds: string[],
  selectedLists: Pick<EntityList, 'entityListFolderId'>[],
): string | undefined =>
  selectedFolderIds[0] ||
  selectedLists.find((list) => list.entityListFolderId)?.entityListFolderId ||
  undefined
