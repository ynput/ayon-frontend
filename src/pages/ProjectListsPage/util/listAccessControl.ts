import { EntityListFolderModel, ListAccessLevel } from '@shared/api'

/**
 * Access levels for lists:
 * 0 - No access (can't see the list)
 * 10 - Viewer (read-only access)
 * 20 - Editor (can rename, change attributes, move)
 * 30 - Admin (can delete list)
 */
export const ACCESS_LEVEL = {
  NONE: 0 as ListAccessLevel,
  VIEWER: 10 as ListAccessLevel,
  EDITOR: 20 as ListAccessLevel,
  ADMIN: 30 as ListAccessLevel,
} as const

export interface UserPermissions {
  isAdmin: boolean
  isManager: boolean
  userName: string
}

/**
 * Minimal interface for list objects that can be checked for access control.
 * Works with both EntityListModel and EntityList types.
 */
export interface ListWithAccessLevel {
  accessLevel?: ListAccessLevel | number | null
}

/**
 * Get the effective access level for a user on a list.
 * Admins and managers always have ADMIN (30) access.
 */
export const getEffectiveAccessLevel = (
  list: ListWithAccessLevel,
  userPermissions: UserPermissions,
): ListAccessLevel => {
  const { isAdmin, isManager } = userPermissions

  // Admins and managers always have full access
  if (isAdmin || isManager) {
    return ACCESS_LEVEL.ADMIN
  }

  // Return the list's access level (defaults to 0 if not set)
  return (list.accessLevel ?? ACCESS_LEVEL.NONE) as ListAccessLevel
}

/**
 * Check if user can view/read a list
 */
export const canViewList = (
  list: ListWithAccessLevel,
  userPermissions: UserPermissions,
): boolean => {
  const accessLevel = getEffectiveAccessLevel(list, userPermissions)
  return accessLevel >= ACCESS_LEVEL.VIEWER
}

/**
 * Check if user can edit a list (rename, change attributes, move)
 */
export const canEditList = (
  list: ListWithAccessLevel,
  userPermissions: UserPermissions,
): boolean => {
  const accessLevel = getEffectiveAccessLevel(list, userPermissions)
  return accessLevel >= ACCESS_LEVEL.ADMIN
}

/**
 * Check if user can delete a list
 */
export const canDeleteList = (
  list: ListWithAccessLevel,
  userPermissions: UserPermissions,
): boolean => {
  const accessLevel = getEffectiveAccessLevel(list, userPermissions)
  return accessLevel >= ACCESS_LEVEL.ADMIN
}

/**
 * Check if user can edit ALL selected lists
 */
export const canEditAllLists = (
  lists: ListWithAccessLevel[],
  userPermissions: UserPermissions,
): boolean => {
  if (lists.length === 0) return false
  return lists.every((list) => canEditList(list, userPermissions))
}

/**
 * Check if user can delete ALL selected lists
 */
export const canDeleteAllLists = (
  lists: ListWithAccessLevel[],
  userPermissions: UserPermissions,
): boolean => {
  if (lists.length === 0) return false
  return lists.every((list) => canDeleteList(list, userPermissions))
}

/**
 * Check if user owns a folder (for folder operations)
 * Note: Folders use ownership-based permissions
 */
export const canEditFolder = (
  folder: EntityListFolderModel,
  userPermissions: UserPermissions,
): boolean => {
  const { isAdmin, isManager, userName } = userPermissions

  // Admins and managers can edit any folder
  if (isAdmin || isManager) {
    return true
  }

  // Regular users can only edit folders they own
  return folder.owner === userName
}

/**
 * Check if user can delete a folder
 */
export const canDeleteFolder = (
  folder: EntityListFolderModel,
  userPermissions: UserPermissions,
): boolean => {
  // Same rules as editing for folders
  return canEditFolder(folder, userPermissions)
}

/**
 * Check if user can edit ALL selected folders
 */
export const canEditAllFolders = (
  folders: EntityListFolderModel[],
  userPermissions: UserPermissions,
): boolean => {
  if (folders.length === 0) return false
  return folders.every((folder) => canEditFolder(folder, userPermissions))
}

/**
 * Check if user can delete ALL selected folders
 */
export const canDeleteAllFolders = (
  folders: EntityListFolderModel[],
  userPermissions: UserPermissions,
): boolean => {
  if (folders.length === 0) return false
  return folders.every((folder) => canDeleteFolder(folder, userPermissions))
}
