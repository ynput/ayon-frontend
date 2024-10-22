import { GetCurrentUserPermissionsApiResponse } from '@api/rest/permissions'
import { useGetCurrentUserPermissionsQuery, useGetCurrentUserProjectPermissionsQuery } from '@queries/permissions/getPermissions'

const UserPermissionsLevel = {
  none: 0,
  readOnly: 1,
  readWrite: 2,
}

class UserPermissions {
  permissions: GetCurrentUserPermissionsApiResponse

  constructor(permissions: GetCurrentUserPermissionsApiResponse) {
    this.permissions = permissions
  }

  canCreateProject(): boolean {
    return this.projectSettingsAreEnabled() && this.permissions?.project?.create || false
  }

  getSettingsPermissionLevel(): typeof UserPermissionsLevel {
    return this.permissions?.project?.settings || UserPermissionsLevel.readWrite
  }

  getAnatomyPermissionLevel(): typeof UserPermissionsLevel {
    return this.permissions?.project?.anatomy || UserPermissionsLevel.readWrite
  }

  canEditSettings(): boolean {
    if (!this.projectSettingsAreEnabled()) {
      return true
    }

    return this.permissions?.project?.settings === UserPermissionsLevel.readWrite
  }

  canEditAnatomy(): boolean {
    if (!this.projectSettingsAreEnabled()) {
      return true
    }

    return this.permissions?.project?.anatomy === UserPermissionsLevel.readWrite
  }

  canViewSettings(): boolean {
    if (!this.projectSettingsAreEnabled()) {
      return true
    }

    return (
      this.canEditSettings() || this.permissions?.project?.settings === UserPermissionsLevel.readOnly
    )
  }

  canViewAnatomy(): boolean {
    if (!this.projectSettingsAreEnabled()) {
      return true
    }

    return (
      this.canEditAnatomy() || this.permissions?.project?.anatomy === UserPermissionsLevel.readOnly
    )
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
