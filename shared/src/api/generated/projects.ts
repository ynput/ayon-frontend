import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    deleteProjectActivity: build.mutation<
      DeleteProjectActivityApiResponse,
      DeleteProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'DELETE',
      }),
    }),
    deleteProjectFile: build.mutation<DeleteProjectFileApiResponse, DeleteProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'DELETE',
      }),
    }),
    getProjectFileHead: build.mutation<GetProjectFileHeadApiResponse, GetProjectFileHeadApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'HEAD',
      }),
    }),
    getProjectFile: build.query<GetProjectFileApiResponse, GetProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
      }),
    }),
    getProjectFileInfo: build.query<GetProjectFileInfoApiResponse, GetProjectFileInfoApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/info`,
      }),
    }),
    getProjectFilePayload: build.query<
      GetProjectFilePayloadApiResponse,
      GetProjectFilePayloadApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/payload`,
      }),
    }),
    getProjectFileThumbnail: build.query<
      GetProjectFileThumbnailApiResponse,
      GetProjectFileThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/thumbnail`,
      }),
    }),
    getProjectFileFilmstrip: build.query<
      GetProjectFileFilmstripApiResponse,
      GetProjectFileFilmstripApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/filmstrip`,
        params: {
          placeholder: queryArg.placeholder,
        },
      }),
    }),
    getProjectFileFilmstripPayload: build.query<
      GetProjectFileFilmstripPayloadApiResponse,
      GetProjectFileFilmstripPayloadApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/filmstrip/payload`,
        params: {
          v: queryArg.v,
        },
      }),
    }),
    getProjectFileStill: build.query<GetProjectFileStillApiResponse, GetProjectFileStillApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/still`,
        params: {
          t: queryArg.t,
        },
      }),
    }),
    getProjectEntityCounts: build.query<
      GetProjectEntityCountsApiResponse,
      GetProjectEntityCountsApiArg
    >({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/entities` }),
    }),
    getProjectHealth: build.query<GetProjectHealthApiResponse, GetProjectHealthApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/health` }),
    }),
    getProjectActivity: build.query<GetProjectActivityApiResponse, GetProjectActivityApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/dashboard/activity`,
        params: {
          days: queryArg.days,
        },
      }),
    }),
    getProjectTeams: build.query<GetProjectTeamsApiResponse, GetProjectTeamsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/users` }),
    }),
    getProjectFolders: build.query<GetProjectFoldersApiResponse, GetProjectFoldersApiArg>({
      query: () => ({ url: `/api/projectFolders` }),
    }),
    createProjectFolder: build.mutation<CreateProjectFolderApiResponse, CreateProjectFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projectFolders`,
        method: 'POST',
        body: queryArg.projectFolderPostModel,
      }),
    }),
    updateProjectFolder: build.mutation<UpdateProjectFolderApiResponse, UpdateProjectFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projectFolders/${queryArg.folderId}`,
        method: 'PATCH',
        body: queryArg.projectFolderPatchModel,
      }),
    }),
    deleteProjectFolder: build.mutation<DeleteProjectFolderApiResponse, DeleteProjectFolderApiArg>({
      query: (queryArg) => ({ url: `/api/projectFolders/${queryArg.folderId}`, method: 'DELETE' }),
    }),
    getProjectAnatomy: build.query<GetProjectAnatomyApiResponse, GetProjectAnatomyApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/anatomy` }),
    }),
    setProjectAnatomy: build.mutation<SetProjectAnatomyApiResponse, SetProjectAnatomyApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/anatomy`,
        method: 'POST',
        body: queryArg.anatomy,
      }),
    }),
    setProjectBundles: build.mutation<SetProjectBundlesApiResponse, SetProjectBundlesApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/bundles`,
        method: 'POST',
        body: queryArg.projectBundleModel,
      }),
    }),
    setProjectBundle: build.mutation<SetProjectBundleApiResponse, SetProjectBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/bundle`,
        method: 'POST',
        body: queryArg.projectBundle,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    unsetProjectBundle: build.mutation<UnsetProjectBundleApiResponse, UnsetProjectBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/bundle`,
        method: 'DELETE',
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    getProjectBundleInfo: build.query<GetProjectBundleInfoApiResponse, GetProjectBundleInfoApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/bundle`,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    deployProject: build.mutation<DeployProjectApiResponse, DeployProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects`,
        method: 'POST',
        body: queryArg.deployProjectRequestModel,
      }),
    }),
    listProjects: build.query<ListProjectsApiResponse, ListProjectsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects`,
        params: {
          page: queryArg.page,
          length: queryArg.length,
          library: queryArg.library,
          active: queryArg.active,
          skeleton: queryArg.skeleton,
          order: queryArg.order,
          desc: queryArg.desc,
          name: queryArg.name,
        },
      }),
    }),
    listGuestUsers: build.query<ListGuestUsersApiResponse, ListGuestUsersApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/guests` }),
    }),
    addGuestUser: build.mutation<AddGuestUserApiResponse, AddGuestUserApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/guests`,
        method: 'POST',
        body: queryArg.addGuestUserModel,
      }),
    }),
    removeGuestUser: build.mutation<RemoveGuestUserApiResponse, RemoveGuestUserApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/guests/${queryArg.email}`,
        method: 'DELETE',
      }),
    }),
    patchGuestUser: build.mutation<PatchGuestUserApiResponse, PatchGuestUserApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/guests/${queryArg.email}`,
        method: 'PATCH',
        body: queryArg.guestUserPatchModel,
      }),
    }),
    getProductTypes: build.query<GetProductTypesApiResponse, GetProductTypesApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/productTypes` }),
    }),
    getProject: build.query<GetProjectApiResponse, GetProjectApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}` }),
    }),
    createProject: build.mutation<CreateProjectApiResponse, CreateProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.projectPostModel,
      }),
    }),
    updateProject: build.mutation<UpdateProjectApiResponse, UpdateProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'PATCH',
        body: queryArg.projectPatchModel,
      }),
    }),
    deleteProject: build.mutation<DeleteProjectApiResponse, DeleteProjectApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}`, method: 'DELETE' }),
    }),
    getProjectStats: build.query<GetProjectStatsApiResponse, GetProjectStatsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/stats` }),
    }),
    renameProject: build.mutation<RenameProjectApiResponse, RenameProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/rename`,
        method: 'POST',
        body: queryArg.renameProjectRequestModel,
      }),
    }),
    getProjectRootsOverrides: build.query<
      GetProjectRootsOverridesApiResponse,
      GetProjectRootsOverridesApiArg
    >({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/roots` }),
    }),
    setProjectRootsOverrides: build.mutation<
      SetProjectRootsOverridesApiResponse,
      SetProjectRootsOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/roots/${queryArg.siteId}`,
        method: 'PUT',
        body: queryArg.payload,
      }),
    }),
    getProjectSiteRoots: build.query<GetProjectSiteRootsApiResponse, GetProjectSiteRootsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/siteRoots`,
        headers: {
          'x-ayon-site-id': queryArg['x-ayon-site-id'],
        },
        params: {
          platform: queryArg.platform,
        },
      }),
    }),
    getProjectTags: build.query<GetProjectTagsApiResponse, GetProjectTagsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/tags` }),
    }),
    getProjectUsers: build.query<GetProjectUsersApiResponse, GetProjectUsersApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/users` }),
    }),
    updateProjectUser: build.mutation<UpdateProjectUserApiResponse, UpdateProjectUserApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/users/${queryArg.userName}`,
        method: 'PATCH',
        body: queryArg.accessGroups,
      }),
    }),
    createProjectThumbnail: build.mutation<
      CreateProjectThumbnailApiResponse,
      CreateProjectThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnail`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getProjectThumbnail: build.query<GetProjectThumbnailApiResponse, GetProjectThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    getProjectEntityUris: build.mutation<
      GetProjectEntityUrisApiResponse,
      GetProjectEntityUrisApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/uris`,
        method: 'POST',
        body: queryArg.getUrisRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type DeleteProjectActivityApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectActivityApiArg = {
  projectName: string
  activityId: string
}
export type DeleteProjectFileApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectFileApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileHeadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileHeadApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileInfoApiResponse = /** status 200 Successful Response */ FileInfo
export type GetProjectFileInfoApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFilePayloadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFilePayloadApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileThumbnailApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileFilmstripApiResponse =
  /** status 200 Successful Response */ FilmstripModel
export type GetProjectFileFilmstripApiArg = {
  projectName: string
  fileId: string
  placeholder?: 'empty' | 'none'
}
export type GetProjectFileFilmstripPayloadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileFilmstripPayloadApiArg = {
  projectName: string
  fileId: string
  v?: string | null
}
export type GetProjectFileStillApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileStillApiArg = {
  projectName: string
  fileId: string
  t?: number
}
export type GetProjectEntityCountsApiResponse = /** status 200 Successful Response */ EntityCounts
export type GetProjectEntityCountsApiArg = {
  projectName: string
}
export type GetProjectHealthApiResponse = /** status 200 Successful Response */ Health
export type GetProjectHealthApiArg = {
  projectName: string
}
export type GetProjectActivityApiResponse =
  /** status 200 Successful Response */ ActivityResponseModel
export type GetProjectActivityApiArg = {
  projectName: string
  /** Number of days to retrieve activity for */
  days?: number
}
export type GetProjectTeamsApiResponse =
  /** status 200 Successful Response */ ProjectTeamsResponseModel
export type GetProjectTeamsApiArg = {
  projectName: string
}
export type GetProjectFoldersApiResponse =
  /** status 200 Successful Response */ ProjectFoldersResponseModel
export type GetProjectFoldersApiArg = void
export type CreateProjectFolderApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateProjectFolderApiArg = {
  projectFolderPostModel: ProjectFolderPostModel
}
export type UpdateProjectFolderApiResponse = /** status 200 Successful Response */ any
export type UpdateProjectFolderApiArg = {
  folderId: string
  projectFolderPatchModel: ProjectFolderPatchModel
}
export type DeleteProjectFolderApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectFolderApiArg = {
  folderId: string
}
export type GetProjectAnatomyApiResponse = /** status 200 Successful Response */ Anatomy
export type GetProjectAnatomyApiArg = {
  projectName: string
}
export type SetProjectAnatomyApiResponse = unknown
export type SetProjectAnatomyApiArg = {
  projectName: string
  anatomy: Anatomy
}
export type SetProjectBundlesApiResponse = unknown
export type SetProjectBundlesApiArg = {
  projectName: string
  projectBundleModel: ProjectBundleModel
}
export type SetProjectBundleApiResponse = /** status 200 Successful Response */ any
export type SetProjectBundleApiArg = {
  projectName: string
  variant?: 'production' | 'staging'
  projectBundle: ProjectBundle
}
export type UnsetProjectBundleApiResponse = unknown
export type UnsetProjectBundleApiArg = {
  projectName: string
  variant?: 'production' | 'staging'
}
export type GetProjectBundleInfoApiResponse = /** status 200 Successful Response */ ProjectBundle
export type GetProjectBundleInfoApiArg = {
  projectName: string
  variant?: 'production' | 'staging'
}
export type DeployProjectApiResponse = /** status 201 Successful Response */ any
export type DeployProjectApiArg = {
  deployProjectRequestModel: DeployProjectRequestModel
}
export type ListProjectsApiResponse =
  /** status 200 Successful Response */ ListProjectsResponseModel
export type ListProjectsApiArg = {
  /** Page number, starting from 1 */
  page?: number
  /** If not provided, the result will not be limited */
  length?: number | null
  /** If not provided, return projects regardless the flag */
  library?: boolean | null
  /** If not provided, return projects regardless the flag */
  active?: boolean | null
  skeleton?: boolean
  /** Attribute to order the list by */
  order?: ('name' | 'createdAt' | 'updatedAt') | null
  desc?: boolean
  /** Limit the result to project with the matching name,
            or its part. % character may be used as a wildcard */
  name?: string | null
}
export type ListGuestUsersApiResponse = /** status 200 Successful Response */ GuestUsersListModel
export type ListGuestUsersApiArg = {
  projectName: string
}
export type AddGuestUserApiResponse = /** status 200 Successful Response */ any
export type AddGuestUserApiArg = {
  projectName: string
  addGuestUserModel: AddGuestUserModel
}
export type RemoveGuestUserApiResponse = /** status 200 Successful Response */ any
export type RemoveGuestUserApiArg = {
  email: string
  projectName: string
}
export type PatchGuestUserApiResponse = /** status 200 Successful Response */ any
export type PatchGuestUserApiArg = {
  email: string
  projectName: string
  guestUserPatchModel: GuestUserPatchModel
}
export type GetProductTypesApiResponse = /** status 200 Successful Response */ ProductTypesList
export type GetProductTypesApiArg = {
  projectName: string
}
export type GetProjectApiResponse = /** status 200 Successful Response */ ProjectModel
export type GetProjectApiArg = {
  projectName: string
}
export type CreateProjectApiResponse = /** status 201 Successful Response */ any
export type CreateProjectApiArg = {
  projectName: string
  projectPostModel: ProjectPostModel
}
export type UpdateProjectApiResponse = unknown
export type UpdateProjectApiArg = {
  projectName: string
  projectPatchModel: ProjectPatchModel
}
export type DeleteProjectApiResponse = unknown
export type DeleteProjectApiArg = {
  projectName: string
}
export type GetProjectStatsApiResponse = /** status 200 Successful Response */ any
export type GetProjectStatsApiArg = {
  projectName: string
}
export type RenameProjectApiResponse = unknown
export type RenameProjectApiArg = {
  projectName: string
  renameProjectRequestModel: RenameProjectRequestModel
}
export type GetProjectRootsOverridesApiResponse = /** status 200 Successful Response */ {
  [key: string]: {
    [key: string]: string
  }
}
export type GetProjectRootsOverridesApiArg = {
  projectName: string
}
export type SetProjectRootsOverridesApiResponse = /** status 200 Successful Response */ any
export type SetProjectRootsOverridesApiArg = {
  siteId: string
  projectName: string
  payload: {
    [key: string]: string | null
  }
}
export type GetProjectSiteRootsApiResponse = /** status 200 Successful Response */ {
  [key: string]: string
}
export type GetProjectSiteRootsApiArg = {
  projectName: string
  platform?: ('windows' | 'linux' | 'darwin') | null
  /** Site ID may be specified either as a query parameter (`site_id` or `site`) or in a header. */
  'x-ayon-site-id'?: string | null
}
export type GetProjectTagsApiResponse = /** status 200 Successful Response */ ProjectTagsModel
export type GetProjectTagsApiArg = {
  projectName: string
}
export type GetProjectUsersApiResponse = /** status 200 Successful Response */ {
  [key: string]: string[]
}
export type GetProjectUsersApiArg = {
  projectName: string
}
export type UpdateProjectUserApiResponse = /** status 200 Successful Response */ {
  [key: string]: string[]
}
export type UpdateProjectUserApiArg = {
  projectName: string
  userName: string
  accessGroups: string[]
}
export type CreateProjectThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateProjectThumbnailApiArg = {
  projectName: string
  'content-type'?: string | null
}
export type GetProjectThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetProjectThumbnailApiArg = {
  projectName: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type GetProjectEntityUrisApiResponse = /** status 200 Successful Response */ GetUrisResponse
export type GetProjectEntityUrisApiArg = {
  projectName: string
  getUrisRequest: GetUrisRequest
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
  input?: any
  ctx?: object
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type FileInfo = {
  size: number
  filename?: string
  contentType?: string
  mediaInfo?: {
    [key: string]: any
  } | null
}
export type FilmstripModel = {
  fileId: string
  url: string
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}
export type EntityCounts = {
  /** Number of folders */
  folders: number
  /** Number of products */
  products: number
  /** Number of versions */
  versions: number
  /** Number of representations */
  representations: number
  /** Number of tasks */
  tasks: number
  /** Number of workfiles */
  workfiles: number
}
export type HealthCompletion = {
  /** Percentage of tasks completed */
  percentage: number
  /** Number of days tasks are not completed after due date */
  behind: number
  /** Number of days tasks are completed before due date */
  ahead: number
}
export type HealthStorageUsage = {
  /** Storage quota */
  quota: number
  /** Storage used */
  used: number
}
export type HealthTasks = {
  /** Total number of tasks */
  total: number
  /** Number of completed tasks */
  completed: number
  /** Number of overdue tasks */
  overdue: number
}
export type Health = {
  /** Task completion */
  completion: HealthCompletion
  /** Storage usage */
  storageUsage: HealthStorageUsage
  /** Task statistics */
  tasks: HealthTasks
  /** Task status statistics */
  statuses: {
    [key: string]: number
  }
}
export type ActivityResponseModel = {
  /** Activity per day normalized to 0-100 */
  activity: number[]
}
export type ProjectTeamsResponseModel = {
  /** Number of active team members */
  teamSizeActive?: number
  /** Total number of team members */
  teamSizeTotal?: number
  /** Number of active users */
  usersWithAccessActive?: number
  /** Total number of users */
  usersWithAccessTotal?: number
  /** Number of users per role */
  roles: {
    [key: string]: number
  }
}
export type ProjectFolderData = {
  /** Hex color code */
  color?: string | null
  /** Icon name */
  icon?: string | null
}
export type ProjectFolderModel = {
  id: string
  label: string
  parentId?: string | null
  position?: number
  isEmpty?: boolean
  data?: ProjectFolderData
}
export type ProjectFoldersResponseModel = {
  folders?: ProjectFolderModel[]
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type ProjectFolderPostModel = {
  id?: string | null
  label: string
  parentId?: string | null
  data?: ProjectFolderData
}
export type ProjectFolderPatchModel = {
  label?: string | null
  parentId?: string | null
  data?: ProjectFolderData | null
}
export type EntityNaming = {
  /** How to capitalize the entity names */
  capitalization?: 'lower' | 'upper' | 'keep' | 'pascal' | 'camel'
  /** Character to separate different parts of the name */
  separator?: '' | '_' | '-' | '.'
}
export type Root = {
  name: string
  windows?: string
  linux?: string
  darwin?: string
}
export type WorkTemplate = {
  name: string
  directory: string
  file: string
}
export type PublishTemplate = {
  name: string
  directory: string
  file: string
}
export type HeroTemplate = {
  name: string
  directory: string
  file: string
}
export type DeliveryTemplate = {
  name: string
  directory: string
  file: string
}
export type StagingDirectory = {
  name: string
  directory?: string
}
export type CustomTemplate = {
  name: string
  value?: string
}
export type Templates = {
  version_padding?: number
  version?: string
  frame_padding?: number
  frame?: string
  work?: WorkTemplate[]
  publish?: PublishTemplate[]
  hero?: HeroTemplate[]
  delivery?: DeliveryTemplate[]
  staging?: StagingDirectory[]
  others?: CustomTemplate[]
}
export type FolderType = {
  name: string
  original_name?: string | null
  shortName?: string
  color?: string
  icon?: string
}
export type TaskType = {
  name: string
  original_name?: string | null
  shortName?: string
  color?: string
  icon?: string
}
export type LinkType = {
  link_type: string
  input_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  output_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  color?: string | null
  style?: 'solid' | 'dashed'
}
export type Status = {
  name: string
  original_name?: string | null
  shortName?: string
  state?: 'not_started' | 'in_progress' | 'done' | 'blocked'
  icon?: string
  color?: string
  /** Limit the status to specific entity types. */
  scope?: string[] | null
}
export type Tag = {
  name: string
  original_name?: string | null
  color?: string
}
export type DefaultProductBaseType = {
  color?: string
  icon?: string
}
export type ProductBaseType = {
  name?: string
  color?: string
  icon?: string
}
export type ProductBaseTypes = {
  /** Default appearance for product types */
  default?: DefaultProductBaseType
  definitions?: ProductBaseType[]
}
export type Anatomy = {
  /** Settings for automatic entity name generation */
  entity_naming?: EntityNaming
  /** Setup root paths for the project */
  roots?: Root[]
  /** Path templates configuration */
  templates?: Templates
  /** Attributes configuration */
  attributes?: {
    [key: string]: any
  }
  /** Folder types configuration */
  folder_types?: FolderType[]
  /** Task types configuration */
  task_types?: TaskType[]
  /** Link types configuration */
  link_types?: LinkType[]
  /** Statuses configuration */
  statuses?: Status[]
  /** Tags configuration */
  tags?: Tag[]
  product_base_types?: ProductBaseTypes
}
export type ProjectBundleModel = {
  production?: string | null
  staging?: string | null
}
export type IconModel = {
  type?: 'material-symbols' | 'url'
  /** The name of the icon (for type material-symbols) */
  name?: string | null
  /** The color of the icon (for type material-symbols) */
  color?: string | null
  /** The URL of the icon (for type url) */
  url?: string | null
}
export type EnumItem = {
  value: string | number | number | boolean
  label: string
  description?: string | null
  fulltext?: string[] | null
  group?: string | null
  /** Icon name (material symbol) or IconModel object */
  icon?: string | IconModel | null
  color?: string | null
  shortName?: string | null
  /** Enum item is visible, but not selectable */
  disabled?: boolean
  /** Message to show when the option is disabled */
  disabledMessage?: string | null
  /** Enum item is not visible in the dropdown */
  hidden?: boolean
  /** Extra badge labels to display next to the item */
  badges?: string[] | null
}
export type AddonMetadata = {
  name: string
  label: string
  options: EnumItem[]
}
export type ProjectBundle = {
  /** Dictionary of addon names and their versions. Use `null` to disable an addon. */
  addons: {
    [key: string]: string | null
  }
  installerVersion?: string | null
  dependencyPackages?: {
    [key: string]: string | null
  } | null
  addonMetadata?: AddonMetadata[]
  installerOptions?: string[]
  dependencyPackageOptions?: {
    [key: string]: string[]
  }
}
export type DeployProjectRequestModel = {
  name: string
  code: string
  label?: string | null
  /** Hex color code for the project highlight (e.g. #ff0000) */
  color?: string | null
  anatomy?: Anatomy | null
  /** Anatomy preset to use instead of providing anatomy */
  anatomyPreset?: string | null
  library?: boolean
  /** Assign default users to the project */
  assignUsers?: boolean
  /** Create a project skeleton instead of a full project */
  skeleton?: boolean
}
export type ListProjectsItemModel = {
  name: string
  code: string
  label?: string | null
  color?: string | null
  active?: boolean
  library?: boolean
  skeleton?: boolean
  pinned?: boolean
  projectFolder?: string | null
  createdAt: string
  updatedAt: string
}
export type ListProjectsResponseModel = {
  detail?: string
  /** Total count of projects (regardless the pagination) */
  count?: number
  /** List of projects */
  projects?: ListProjectsItemModel[]
}
export type GuestUserModel = {
  email: string
  fullName?: string | null
  status?: 'pending' | 'active'
}
export type GuestUsersListModel = {
  users?: GuestUserModel[]
}
export type AddGuestUserModel = {
  email: string
  fullName?: string | null
}
export type GuestUserPatchModel = {
  email?: string | null
  avatarUrl?: string | null
  fullName?: string | null
  status?: ('pending' | 'active') | null
}
export type ProductTypeListItem = {
  name: string
  baseType?: string | null
  color?: string | null
  icon?: string | null
}
export type DefaultProductType = {
  color: string
  icon: string
}
export type ProductTypesList = {
  productTypes?: ProductTypeListItem[]
  default: DefaultProductType
}
export type LinkTypeModel = {
  /** Name of the link type */
  name: string
  /** Type of the link */
  linkType: string
  /** Input entity type */
  inputType: string
  /** Output entity type */
  outputType: string
  /** Additional link type data */
  data?: {
    [key: string]: any
  }
}
export type ProjectModel = {
  /** Unique name of the project */
  name: string
  code: string
  label?: string | null
  library?: boolean
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[]
  statuses?: Status[]
  tags?: Tag[]
  config?: {
    [key: string]: any
  }
  skeleton?: boolean | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
  /** List of attributes explicitly set on the entity itself (not inherited) */
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ProjectPostModel = {
  code: string
  label?: string | null
  library?: boolean
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[]
  statuses?: Status[]
  tags?: Tag[]
  config?: {
    [key: string]: any
  }
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
}
export type ProjectPatchModel = {
  code?: string | null
  label?: string | null
  library?: boolean | null
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[] | null
  statuses?: Status[]
  tags?: Tag[]
  config?: {
    [key: string]: any
  } | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  } | null
  /** Whether the entity is active */
  active?: boolean | null
}
export type RenameProjectRequestModel = {
  name: string
  /** If not provided, the code will remain unchanged. */
  code?: string | null
}
export type ProjectTagsModel = {
  folders?: string[]
  tasks?: string[]
  products?: string[]
  versions?: string[]
  representations?: string[]
  workfiles?: string[]
}
export type AffectedEntity = {
  entityType: string
  entityId: string
  thumbnailHash: string
  thumbnailId?: string | null
}
export type CreateThumbnailResponseModel = {
  id: string
  affectedEntities?: AffectedEntity[] | null
}
export type UriResponseItem = {
  id: string
  uri: string
}
export type GetUrisResponse = {
  uris?: UriResponseItem[]
}
export type GetUrisRequest = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  ids?: string[]
}
