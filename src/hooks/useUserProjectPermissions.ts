import { StudioManagementPermissions } from '@api/rest/users'
import { Module } from '@pages/ProjectManagerPage/mappers'
import { useGetCurrentUserPermissionsQuery } from '@queries/permissions/getPermissions'

type AllProjectsPremissions = {
  projects: {
    [projectName: string]: {
      project: {
        anatomy: PermissionLevel
        create: boolean
        enabled: boolean
        settings: PermissionLevel
        users: PermissionLevel
      }
    }
  }
  studio: StudioManagementPermissions
  user_level: 'user' | 'admin'
}

enum PermissionLevel {
  none = 0,
  readOnly = 1,
  readWrite = 2,
}

export enum UserPermissionsEntity {
  users = 'users',
  anatomy = 'anatomy',
  settings = 'settings',
}

class UserPermissions {
  permissions: AllProjectsPremissions
  hasElevatedPrivileges: boolean

  constructor(permissions: AllProjectsPremissions, hasLimitedPermissions: boolean = false) {
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

    return (this.projectSettingsAreEnabled() && this.permissions.studio.create_projects) || false
  }

  getPermissionLevel(type: UserPermissionsEntity, projectName: string): PermissionLevel {
    if (this.hasElevatedPrivileges) {
      return PermissionLevel.readWrite
    }
    if (!this.permissions) {
      return PermissionLevel.none
    }

    return this.permissions.projects[projectName]?.project[type] || PermissionLevel.none
  }

  canEdit(type: UserPermissionsEntity, projectName: string): boolean {
    if (this.hasElevatedPrivileges || !this.projectSettingsAreEnabled()) {
      return true
    }
    if (!this.permissions || !projectName) {
      return false
    }

    return this.permissions.projects[projectName]?.project[type] === PermissionLevel.readWrite
  }

  canAccessModule(module: string, projectName: string): boolean {
    if (module === Module.siteSettings) {
      return true
    }

    if (module === Module.projectSettings) {
      return this.canView(UserPermissionsEntity.settings, projectName)
    }

    if (module === Module.anatomy) {
      return this.canView(UserPermissionsEntity.anatomy, projectName)
    }
    if (module === Module.userSettings) {
      return this.canView(UserPermissionsEntity.users, projectName)
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

    if (this.permissions.projects[projectName]?.project[type] === PermissionLevel.readOnly) {
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

    if (this.permissions.projects[projectName] !== undefined) {
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
      return this.canView(UserPermissionsEntity.users, projectName)
    }

    return this.canViewAny(UserPermissionsEntity.users)
  }

  projectSettingsAreEnabled(): boolean {
    return this.permissions?.user_level === 'user'
  }
}

const useUserProjectPermissions = (
  hasLimitedPermissions?: boolean,
): {isLoading: boolean, permissions: UserPermissions | undefined} => {
  const { data: permissions, isLoading } = useGetCurrentUserPermissionsQuery()

  return {isLoading, permissions: new UserPermissions(permissions, hasLimitedPermissions)}
}

export { UserPermissions, PermissionLevel }
export default useUserProjectPermissions
