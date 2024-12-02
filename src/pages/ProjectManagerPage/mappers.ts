import { UserPermissions, UserPermissionsEntity } from '@hooks/useUserProjectPermissions'

export enum Module {
  anatomy = 'anatomy',
  projectSettings = 'projectSettings',
  siteSettings = 'siteSettings',
  userSettings = 'userSettings',
  roots = 'roots',
  teams = 'teams',
  permisssions = 'permisssions',
}

const ModuleList = [
  Module.anatomy,
  Module.projectSettings,
  Module.siteSettings,
  Module.userSettings,
  Module.roots,
  Module.teams,
  Module.permisssions,
]

const ModulePath = {
  [Module.anatomy]: '/manageProjects/anatomy',
  [Module.projectSettings]: '/manageProjects/projectSettings',
  [Module.siteSettings]: '/manageProjects/siteSettings',
  [Module.userSettings]: '/manageProjects/userSettings',
  [Module.roots]: '/manageProjects/roots',
  [Module.teams]: '/manageProjects/teams',
  [Module.permisssions]: '/manageProjects/permissions',
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
    if (module === Module.roots) {
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
    if (module === Module.roots) {
      return userPermissions.assignedToProject(projectName)
    }
    return true
  }

export { projectSorter, isActiveDecider, ModuleList, ModulePath }
