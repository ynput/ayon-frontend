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
  studio: {
    create_project: boolean
  }
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
    this.hasElevatedPrivileges = hasLimitedPermissions
  }

  canCreateProject(): boolean {
    if (this.hasElevatedPrivileges) {
      return true
    }
    if (!this.permissions) {
      return false
    }

    return (this.projectSettingsAreEnabled() && this.permissions.studio.create_project) || false
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

  canViewSettings(projectName?: string ): boolean {
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
    if (!this.permissions) {
      return false
    }

    for (const projectName of Object.keys(this.permissions.projects)) {
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

const useUserProjectPermissions = (hasLimitedPermissions?: boolean): UserPermissions | undefined => {
  const { data: permissions } = useGetCurrentUserPermissionsQuery()

  return new UserPermissions(permissions, hasLimitedPermissions)
}

export { PermissionLevel}
export default useUserProjectPermissions
