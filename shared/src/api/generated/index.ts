import api from '../base'
// shuts up the error "already exported a member named 'api'"
export { api }

// graphql
export * from './graphql'
export { api as gqlApi } from './graphql'

// graphqlLinks
export { api as gqlLinksApi } from './graphqlLinks'
export type {
  GetFolderLinkDataDocument,
  GetFolderLinkDataQuery,
  GetFolderLinkDataQueryVariables,
  GetFoldersLinksDocument,
  GetFoldersLinksQuery,
  GetFoldersLinksQueryVariables,
  GetProductLinkDataDocument,
  GetProductLinkDataQuery,
  GetProductLinkDataQueryVariables,
  GetProductsLinksDocument,
  GetProductsLinksQuery,
  GetProductsLinksQueryVariables,
  GetRepresentationLinkDataDocument,
  GetRepresentationLinkDataQuery,
  GetRepresentationLinkDataQueryVariables,
  GetRepresentationsLinksDocument,
  GetRepresentationsLinksQuery,
  GetRepresentationsLinksQueryVariables,
  GetSearchedFoldersDocument,
  GetSearchedFoldersQuery,
  GetSearchedFoldersQueryVariables,
  GetSearchedProductsDocument,
  GetSearchedProductsQuery,
  GetSearchedProductsQueryVariables,
  GetSearchedRepresentationsDocument,
  GetSearchedRepresentationsQuery,
  GetSearchedRepresentationsQueryVariables,
  GetSearchedTasksDocument,
  GetSearchedTasksQuery,
  GetSearchedTasksQueryVariables,
  GetSearchedVersionsDocument,
  GetSearchedVersionsQuery,
  GetSearchedVersionsQueryVariables,
  GetSearchedWorkfilesDocument,
  GetSearchedWorkfilesQuery,
  GetSearchedWorkfilesQueryVariables,
  GetTaskLinkDataDocument,
  GetTaskLinkDataQuery,
  GetTaskLinkDataQueryVariables,
  GetTasksLinksDocument,
  GetTasksLinksQuery,
  GetTasksLinksQueryVariables,
  GetVersionLinkDataDocument,
  GetVersionLinkDataQuery,
  GetVersionLinkDataQueryVariables,
  GetVersionsLinksDocument,
  GetVersionsLinksQuery,
  GetVersionsLinksQueryVariables,
  GetWorkfileLinkDataDocument,
  GetWorkfileLinkDataQuery,
  GetWorkfileLinkDataQueryVariables,
  GetWorkfilesLinksDocument,
  GetWorkfilesLinksQuery,
  GetWorkfilesLinksQueryVariables,
  OverviewEntityLinkFragmentFragment,
  OverviewEntityLinkFragmentFragmentDoc,
  OverviewEntityLinkNodeFragmentFragment,
  OverviewEntityLinkNodeFragmentFragmentDoc,
} from './graphqlLinks'

// access
export * from './access'
export { api as accessApi } from './access'
export type {
  HttpValidationError,
  ValidationError,
  AttributeReadAccessList,
  AttributeWriteAccessList,
  EndpointsAccessList,
  FolderAccess,
  FolderAccessList,
  ProjectManagementPermissions,
  StudioManagementPermissions,
} from './access'

// actions
export * from './actions'
export { api as actionsApi } from './actions'

// activityFeed
export * from './activityFeed'
export { api as activityFeedApi } from './activityFeed'
export type { DeleteProjectActivityApiArg, DeleteProjectActivityApiResponse } from './activityFeed'

// addons
export * from './addons'
export { api as addonsApi } from './addons'
export type { AddonList, AddonListItem } from './addons'

// anatomy
export * from './anatomy'
export { api as anatomyApi } from './anatomy'
export type {
  Anatomy,
  CustomTemplate,
  DeliveryTemplate,
  HeroTemplate,
  LinkType,
  ProjectAttribModel,
  PublishTemplate,
  Root,
  StagingDirectory,
  Status,
  Tag,
  Templates,
  WorkTemplate,
  FolderType,
  TaskType,
} from './anatomy'

// attributes
export * from './attributes'
export { api as attributesApi } from './attributes'
export type { AttributeData, AttributeEnumItem, AttributeModel } from './attributes'

// authentication
export * from './authentication'
export { api as authenticationApi } from './authentication'
export type {
  LoginResponseModel,
  UserAttribModel,
  UserModel,
  AgentInfo,
  ClientInfo,
  GetUserPoolsApiArg,
  GetUserPoolsApiResponse,
  LocationInfo,
  UserPoolModel,
} from './authentication'

// bundles
export * from './bundles'
export { api as bundlesApi } from './bundles'

// configuration
export * from './configuration'
export { api as configurationApi } from './configuration'

// desktop
export * from './desktop'
export { api as desktopApi } from './desktop'
export type { SourceModel } from './desktop'

// entityLists
export * from './entityLists'
export { api as entityListsApi } from './entityLists'

// events
export * from './events'
export { api as eventsApi } from './events'
export type {
  EventOperationModel,
  EventOperationsApiArg,
  EventOperationsApiResponse,
  QueryCondition,
  QueryFilter,
  QueryTasksFoldersApiArg,
  QueryTasksFoldersApiResponse,
  TasksFoldersQuery,
  TasksFoldersResponse,
} from './events'

// files
export * from './files'
export { api as filesApi } from './files'
export type {
  DeleteProjectFileApiArg,
  DeleteProjectFileApiResponse,
  GetProjectFileApiArg,
  GetProjectFileApiResponse,
  GetProjectFileHeadApiArg,
  GetProjectFileHeadApiResponse,
  GetProjectFilePayloadApiArg,
  GetProjectFilePayloadApiResponse,
  GetProjectFileStillApiArg,
  GetProjectFileStillApiResponse,
  GetProjectFileThumbnailApiArg,
  GetProjectFileThumbnailApiResponse,
} from './files'

// folders
export * from './folders'
export { api as foldersApi } from './folders'
export type {
  EntityIdResponse,
  CreateThumbnailResponseModel,
  CreateFolderThumbnailApiArg,
  CreateFolderThumbnailApiResponse,
  GetFolderThumbnailApiArg,
  GetFolderThumbnailApiResponse,
} from './folders'

// inbox
export * from './inbox'
export { api as inboxApi } from './inbox'

// links
export * from './links'
export { api as linksApi } from './links'
export type { LinkTypeModel } from './links'

// market
export * from './market'
export { api as marketApi } from './market'

// onboarding
export * from './onboarding'
export { api as onboardingApi } from './onboarding'

// operations
export * from './operations'
export { api as operationsApi } from './operations'

// products
export * from './products'
export { api as productsApi } from './products'
export type {
  GetProductionMetricsApiArg,
  GetProductionMetricsApiResponse,
  Metrics,
  ProductionBundle,
  ProjectCounts,
  ProjectMetrics,
  ReleaseInfo,
  ServiceInfo,
  SettingsOverrides,
  SystemMetricsData,
  TrafficStat,
  UserCounts,
  UserStat,
} from './products'

// projectDashboard
export * from './projectDashboard'
export { api as projectDashboardApi } from './projectDashboard'
export type {
  ActivityResponseModel,
  EntityCounts,
  GetProjectActivityApiArg,
  GetProjectActivityApiResponse,
  GetProjectEntityCountsApiArg,
  GetProjectEntityCountsApiResponse,
  GetProjectHealthApiArg,
  GetProjectHealthApiResponse,
  GetProjectTeamsApiArg,
  GetProjectTeamsApiResponse,
  Health,
  HealthCompletion,
  HealthStorageUsage,
  HealthTasks,
  ProjectTeamsResponseModel,
} from './projectDashboard'

// projects
export * from './projects'
export { api as projectsApi } from './projects'
export type {
  GetProjectEntityUrisApiArg,
  GetProjectEntityUrisApiResponse,
  GetUrisRequest,
  GetUrisResponse,
  UriResponseItem,
  FileInfo,
  GetProjectFileInfoApiArg,
  GetProjectFileInfoApiResponse,
} from './projects'

// reviewables
export * from './reviewables'
export { api as reviewablesApi } from './reviewables'

// services
export * from './services'
export { api as servicesApi } from './services'

// system
export * from './system'
export { api as systemApi } from './system'

// tasks
export * from './tasks'
export { api as tasksApi } from './tasks'
export type {
  CreateTaskThumbnailApiArg,
  CreateTaskThumbnailApiResponse,
  GetTaskThumbnailApiArg,
  GetTaskThumbnailApiResponse,
} from './tasks'

// teams
export * from './teams'
export { api as teamsApi } from './teams'

// thumbnails
export * from './thumbnails'
export { api as thumbnailsApi } from './thumbnails'
export type {
  CreateVersionThumbnailApiArg,
  CreateVersionThumbnailApiResponse,
  GetVersionThumbnailApiArg,
  GetVersionThumbnailApiResponse,
  CreateWorkfileThumbnailApiArg,
  CreateWorkfileThumbnailApiResponse,
  GetWorkfileThumbnailApiArg,
  GetWorkfileThumbnailApiResponse,
} from './thumbnails'

// uRIs
export * from './uRIs'
export { api as uRIsApi } from './uRIs'

// users
export * from './users'
export { api as usersApi } from './users'

// versions
export * from './versions'
export { api as versionsApi } from './versions'

// workfiles
export * from './workfiles'
export { api as workfilesApi } from './workfiles'

// ynputCloud
export * from './ynputCloud'
export { api as ynputCloudApi } from './ynputCloud'

// grouping
export * from './grouping'
export { api as groupingApi } from './grouping'
