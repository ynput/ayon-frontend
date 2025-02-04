import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'

export enum Module {
  anatomy = 'anatomy',
  projectSettings = 'projectSettings',
  siteSettings = 'siteSettings',
  projectAccess = 'projectAccess',
  roots = 'roots',
  teams = 'teams',
  permissions = 'permissions',
}

const ModuleList = [
  Module.anatomy,
  Module.projectSettings,
  Module.siteSettings,
  Module.projectAccess,
  Module.roots,
  Module.teams,
  Module.permissions,
]

const ModulePath = {
  [Module.anatomy]: '/manageProjects/anatomy',
  [Module.projectSettings]: '/manageProjects/projectSettings',
  [Module.siteSettings]: '/manageProjects/siteSettings',
  [Module.projectAccess]: '/manageProjects/projectAccess',
  [Module.roots]: '/manageProjects/roots',
  [Module.teams]: '/manageProjects/teams',
  [Module.permissions]: '/manageProjects/permissions',
}

const projectSorter =
  ({
    userPermissions,
    isLoadingUserPermissions,
    module,
  }: {
    userPermissions: UserPermissions
    isLoadingUserPermissions: boolean
    module: string
  }) =>
  (a: string, b: string) => {
    if (isLoadingUserPermissions) {
      return 1
    }
    if (module === Module.anatomy) {
      const aPerm = userPermissions.canView(UserPermissionsEntity.anatomy, a) ? 1 : -1
      const bPerm = userPermissions.canView(UserPermissionsEntity.anatomy, b) ? 1 : -1
      return bPerm - aPerm
    }
    if (module === Module.projectSettings) {
      const aPerm = userPermissions.canView(UserPermissionsEntity.settings, a) ? 1 : -1
      const bPerm = userPermissions.canView(UserPermissionsEntity.settings, b) ? 1 : -1
      return bPerm - aPerm
    }
    if ([Module.roots, Module.siteSettings].includes(module as Module)) {
      const aPerm = userPermissions.assignedToProject(a) ? 1 : -1
      const bPerm = userPermissions.assignedToProject(b) ? 1 : -1
      return bPerm - aPerm
    }
    return 0
  }

const isActiveDecider =
  ({
    userPermissions,
    module,
  }: {
    projectName: string
    userPermissions: UserPermissions
    module: string
  }) =>
  (projectName: string) => {
    if (module === Module.anatomy) {
      return userPermissions.canView(UserPermissionsEntity.anatomy, projectName)
    }
    if (module === Module.projectSettings) {
      return userPermissions.canView(UserPermissionsEntity.settings, projectName)
    }
    if ([Module.roots, Module.siteSettings].includes(module as Module)) {
      return userPermissions.assignedToProject(projectName)
    }
    return true
  }

export { projectSorter, isActiveDecider, ModuleList, ModulePath }
