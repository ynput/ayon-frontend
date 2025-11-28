import { useGetMyPermissionsQuery, UserPermissionsModel } from '@shared/api'
import { Module } from '@pages/ProjectManagerPage/mappers'

enum PermissionLevel {
  none = 0,
  readOnly = 1,
  readWrite = 2,
}

export enum UserPermissionsEntity {
  // TODO This needs to be in sync with ProjectManagementPermissions
  access = 'access',
  anatomy = 'anatomy',
  settings = 'settings',
}

class UserPermissions {
  permissions: UserPermissionsModel
  hasElevatedPrivileges: boolean

  constructor(permissions: UserPermissionsModel, hasLimitedPermissions: boolean = false) {
    this.permissions = permissions
    this.hasElevatedPrivileges = !hasLimitedPermissions
  }

  canCreateProject(): boolean {
    if (this.hasElevatedPrivileges) {
      return true
    }
    if (!this.permissions) {
      return false
    }

    return (this.projectSettingsAreEnabled() && this.permissions.studio?.create_projects) || false
  }

  getPermissionLevel(type: UserPermissionsEntity, projectName: string): PermissionLevel {
    if (this.hasElevatedPrivileges) {
      return PermissionLevel.readWrite
    }
    if (!this.permissions) {
      return PermissionLevel.none
    }

    return this.permissions.projects?.[projectName]?.project?.[type] || PermissionLevel.none
  }

  canEdit(type: UserPermissionsEntity, projectName: string): boolean {
    if (this.hasElevatedPrivileges || !this.projectSettingsAreEnabled()) {
      return true
    }
    if (!this.permissions || !projectName) {
      return false
    }

    return this.permissions.projects?.[projectName]?.project?.[type] === PermissionLevel.readWrite
  }

  canAccessModule({ module, projectName }: { module: string; projectName: string }): boolean {
    if (module === Module.siteSettings) {
      return true
    }

    if (module === Module.projectSettings) {
      return this.canView(UserPermissionsEntity.settings, projectName)
    }

    if (module === Module.anatomy) {
      return this.canView(UserPermissionsEntity.anatomy, projectName)
    }
    if (module === Module.projectAccess) {
      return this.canView(UserPermissionsEntity.access, projectName)
    }
    if (module === Module.roots) {
      return this.assignedToProject(projectName)
    }

    return true
  }

  canView(type: UserPermissionsEntity, projectName: string): boolean {
    if (!this.permissions) {
      return false
    }

    if (this.hasElevatedPrivileges || !this.projectSettingsAreEnabled()) {
      return true
    }

    if (this.canEdit(type, projectName)) {
      return true
    }

    if (this.permissions.projects?.[projectName]?.project?.[type] === PermissionLevel.readOnly) {
      return true
    }

    return false
  }

  getAnatomyPermissionLevel(projectName: string): PermissionLevel {
    return this.getPermissionLevel(UserPermissionsEntity.anatomy, projectName)
  }

  canEditSettings(projectName: string): boolean {
    return this.canEdit(UserPermissionsEntity.settings, projectName)
  }

  canEditAnatomy(projectName: string): boolean {
    return this.canEdit(UserPermissionsEntity.anatomy, projectName)
  }

  assignedToProject(projectName: string): boolean {
    if (!this.permissions) {
      return false
    }

    if (this.hasElevatedPrivileges || !this.projectSettingsAreEnabled()) {
      return true
    }

    if (this.permissions.projects?.[projectName] !== undefined) {
      return true
    }

    return false
  }

  canViewSettings(projectName?: string): boolean {
    if (projectName) {
      return this.canView(UserPermissionsEntity.settings, projectName)
    }

    return this.canViewAny(UserPermissionsEntity.settings)
  }

  canViewAnatomy(projectName?: string): boolean {
    if (projectName) {
      return this.canView(UserPermissionsEntity.anatomy, projectName)
    }

    return this.canViewAny(UserPermissionsEntity.anatomy)
  }

  canViewAny(type: UserPermissionsEntity): boolean {
    if (this.hasElevatedPrivileges) {
      return true
    }

    if (!this.permissions) {
      return false
    }

    for (const projectName of Object.keys(this.permissions?.projects || {})) {
      if (this.canView(type, projectName)) {
        return true
      }
    }

    return false
  }

  canViewUsers(projectName?: string): boolean {
    if (projectName) {
      return this.canView(UserPermissionsEntity.access, projectName)
    }

    return this.canViewAny(UserPermissionsEntity.access)
  }

  projectSettingsAreEnabled(): boolean {
    return this.permissions?.user_level === 'user'
  }
  canListAllUsers(): boolean {
    if (this.hasElevatedPrivileges) {
      return true
    }

    if (!this.permissions) {
      return false
    }

    return this.permissions.studio?.list_all_users || false
  }
}

const useUserProjectPermissions = (
  hasLimitedPermissions?: boolean,
): { isLoading: boolean; permissions: UserPermissions | undefined } => {
  const { data: permissions = {}, isLoading } = useGetMyPermissionsQuery()

  return { isLoading, permissions: new UserPermissions(permissions, hasLimitedPermissions) }
}

export { UserPermissions, PermissionLevel }
export default useUserProjectPermissions
