import api from '../base'
// shuts up the error "already exported a member named 'api'"
export { api }

export * from './graphql'
export { api as gqlApi } from './graphql'
// access
export * from './access'
export { api as accessApi } from './access'
// accessGroups
export * from './accessGroups'
export { api as accessGroupsApi } from './accessGroups'
// actions
export * from './actions'
export { api as actionsApi } from './actions'
// activities
export * from './activities'
export { api as activitiesApi } from './activities'
// addons
export * from './addons'
export { api as addonsApi } from './addons'
// attributes
export * from './attributes'
export { api as attributesApi } from './attributes'
// auth
export * from './auth'
export { api as authApi } from './auth'
// bundles
export * from './bundles'
export { api as bundlesApi } from './bundles'
// cloud
export * from './cloud'
export { api as cloudApi } from './cloud'
// config
export * from './config'
export { api as configApi } from './config'
// dependencyPackages
export * from './dependencyPackages'
export { api as dependencyPackagesApi } from './dependencyPackages'
// folders
export * from './folders'
export { api as foldersApi } from './folders'
// inbox
export * from './inbox'
export { api as inboxApi } from './inbox'
// installers
export * from './installers'
export { api as installersApi } from './installers'
// market
export * from './market'
export { api as marketApi } from './market'
// modules
export * from './modules'
export { api as modulesApi } from './modules'
// operations
export * from './operations'
export { api as operationsApi } from './operations'
// permissions
export * from './permissions'
export { api as permissionsApi } from './permissions'
// project
export * from './project'
export { api as projectApi } from './project'
// releases
export * from './releases'
export { api as releasesApi } from './releases'
// review
export * from './review'
export { api as reviewApi } from './review'
// services
export * from './services'
export { api as servicesApi } from './services'
// users
export * from './users'
export { api as usersApi } from './users'
// watchers
export * from './watchers'
export { api as watchersApi } from './watchers'

// explicit type exports
export type {
  AgentInfo,
  ClientInfo,
  LocationInfo,
  UserAttribModel,
  UserModel,
  GetUserPoolsApiArg,
  GetUserPoolsApiResponse,
  UserPoolModel,
} from './auth'
export type { ErrorResponse } from './permissions'
export type { InstallResponseModel } from './installers'
export type { FolderType, TaskType } from './project'
export type { KanbanNode } from './graphql'
export type { QueryCondition, QueryFilter } from './folders'
export type { HttpValidationError, ValidationError } from './activities'
export type { AttributeData, AttributeEnumItem, AttributeModel } from './attributes'
export type { SourceModel } from './dependencyPackages'
export type { AddonList, AddonListItem } from './addons'
export type {
  EndpointsAccessList,
  FolderAccess,
  FolderAccessList,
  Permissions,
  ProjectManagementPermissions,
  StudioManagementPermissions,
  AttributeReadAccessList,
  AttributeWriteAccessList,
} from './accessGroups'
export type { AddonVersionDetail, LinkModel } from './market'
