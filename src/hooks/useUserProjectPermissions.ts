import { GetCurrentUserPermissionsApiResponse } from '@api/rest/permissions'
import { useGetCurrentUserPermissionsQuery, useGetCurrentUserProjectPermissionsQuery } from '@queries/permissions/getPermissions'

enum UserPermissionsLevel {
  none = 0,
  readOnly = 1,
  readWrite = 2,
}

enum UserPermissionsEntity {
  users = 'users',
  anatomy = 'anatomy',
  settings = 'settings',
}

class UserPermissions {
  permissions: GetCurrentUserPermissionsApiResponse

  constructor(permissions: GetCurrentUserPermissionsApiResponse) {
    this.permissions = permissions
  }

  canCreateProject(): boolean {
    return this.projectSettingsAreEnabled() && this.permissions?.project?.create || false
  }

  getPermissionLevel(type: UserPermissionsEntity): UserPermissionsLevel {
    return this.permissions?.project?.[type]|| UserPermissionsLevel.readWrite
  }

  canEdit(type: UserPermissionsEntity): boolean {
    if (!this.projectSettingsAreEnabled()) {
      return true
    }

    return this.permissions?.project?.[type] === UserPermissionsLevel.readWrite
  }

  canView(type: UserPermissionsEntity): boolean {
    if (!this.projectSettingsAreEnabled()) {
      return true
    }

    return (
      this.canEdit(type) || this.permissions?.project?.[type]=== UserPermissionsLevel.readOnly
    )

  }

  getSettingsPermissionLevel(): UserPermissionsLevel {
    return this.getPermissionLevel(UserPermissionsEntity.settings)
  }

  getAnatomyPermissionLevel(): UserPermissionsLevel {
    return this.getPermissionLevel(UserPermissionsEntity.anatomy)
  }

  getUsersPermissionLevel(): UserPermissionsLevel {
    return this.getPermissionLevel(UserPermissionsEntity.users)
  }

  canEditSettings(): boolean {
    return this.canEdit(UserPermissionsEntity.settings)
  }

  canEditAnatomy(): boolean {
    return this.canEdit(UserPermissionsEntity.anatomy)
  }

  canEditUsers(): boolean {
    return this.canEdit(UserPermissionsEntity.users)
  }

  canViewSettings(): boolean {
    return this.canView(UserPermissionsEntity.settings)
  }

  canViewAnatomy(): boolean {
    return this.canView(UserPermissionsEntity.anatomy)
  }

  canViewUsers(): boolean {
    return this.canView(UserPermissionsEntity.users)
  }

  projectSettingsAreEnabled(): boolean {
    return this.permissions?.project?.enabled
  }
}

const useUserProjectPermissions = (projectName?: string): UserPermissions | undefined => {
  const { data: permissions } = projectName
    ? useGetCurrentUserProjectPermissionsQuery({ projectName })
    : useGetCurrentUserPermissionsQuery()

  return new UserPermissions(permissions)
}

export { UserPermissionsLevel }
export default useUserProjectPermissions
