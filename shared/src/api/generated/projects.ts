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
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    getProjectFile: build.query<GetProjectFileApiResponse, GetProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
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
    getProjectAnatomy: build.query<GetProjectAnatomyApiResponse, GetProjectAnatomyApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/anatomy` }),
    }),
    setProjectAnatomy: build.mutation<SetProjectAnatomyApiResponse, SetProjectAnatomyApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/anatomy`,
        method: 'POST',
        body: queryArg.anatomy,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    setProjectBundle: build.mutation<SetProjectBundleApiResponse, SetProjectBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/bundles`,
        method: 'POST',
        body: queryArg.projectBundleModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
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
          order: queryArg.order,
          desc: queryArg.desc,
          name: queryArg.name,
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
    getProject: build.query<GetProjectApiResponse, GetProjectApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}` }),
    }),
    createProject: build.mutation<CreateProjectApiResponse, CreateProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.projectPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteProject: build.mutation<DeleteProjectApiResponse, DeleteProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateProject: build.mutation<UpdateProjectApiResponse, UpdateProjectApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}`,
        method: 'PATCH',
        body: queryArg.projectPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    getProjectStats: build.query<GetProjectStatsApiResponse, GetProjectStatsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/stats` }),
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
    planner010DevGetProjectPlannerStatus: build.query<
      Planner010DevGetProjectPlannerStatusApiResponse,
      Planner010DevGetProjectPlannerStatusApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/planner/0.1.0-dev/setup`,
        params: {
          project: queryArg.project,
        },
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
  'x-sender'?: string
  'x-sender-type'?: string
}
export type GetProjectFileApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileApiArg = {
  projectName: string
  fileId: string
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
export type GetProjectAnatomyApiResponse = /** status 200 Successful Response */ Anatomy
export type GetProjectAnatomyApiArg = {
  projectName: string
}
export type SetProjectAnatomyApiResponse = unknown
export type SetProjectAnatomyApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  anatomy: Anatomy
}
export type SetProjectBundleApiResponse = unknown
export type SetProjectBundleApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  projectBundleModel: ProjectBundleModel
}
export type ListProjectsApiResponse =
  /** status 200 Successful Response */ ListProjectsResponseModel
export type ListProjectsApiArg = {
  page?: number
  /** If not provided, the result will not be limited */
  length?: number
  /** If not provided, return projects regardless the flag */
  library?: boolean
  /** If not provided, return projects regardless the flag */
  active?: boolean
  order?: 'name' | 'createdAt' | 'updatedAt'
  desc?: boolean
  /** Limit the result to project with the matching name,
            or its part. % character may be used as a wildcard */
  name?: string
}
export type DeployProjectApiResponse = /** status 201 Successful Response */ any
export type DeployProjectApiArg = {
  deployProjectRequestModel: DeployProjectRequestModel
}
export type GetProjectApiResponse = /** status 200 Successful Response */ ProjectModel
export type GetProjectApiArg = {
  projectName: string
}
export type CreateProjectApiResponse = /** status 201 Successful Response */ any
export type CreateProjectApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  projectPostModel: ProjectPostModel
}
export type DeleteProjectApiResponse = unknown
export type DeleteProjectApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateProjectApiResponse = unknown
export type UpdateProjectApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  projectPatchModel: ProjectPatchModel
}
export type GetProjectStatsApiResponse = /** status 200 Successful Response */ any
export type GetProjectStatsApiArg = {
  projectName: string
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
    [key: string]: string
  }
}
export type GetProjectSiteRootsApiResponse = /** status 200 Successful Response */ {
  [key: string]: string
}
export type GetProjectSiteRootsApiArg = {
  projectName: string
  platform?: 'windows' | 'linux' | 'darwin'
  /** Site ID may be specified either as a query parameter (`site_id` or `site`) or in a header. */
  'x-ayon-site-id'?: string
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
export type GetProjectEntityUrisApiResponse = /** status 200 Successful Response */ GetUrisResponse
export type GetProjectEntityUrisApiArg = {
  projectName: string
  getUrisRequest: GetUrisRequest
}
export type Planner010DevGetProjectPlannerStatusApiResponse =
  /** status 200 Successful Response */ PlannerProjectStatus
export type Planner010DevGetProjectPlannerStatusApiArg = {
  project?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type FileInfo = {
  size: number
  filename?: string
  contentType?: string
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
export type ProjectAttribModel = {
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
  applications?: string[]
  tools?: string[]
  ftrackId?: string
  ftrackPath?: string
  /** The Shotgrid ID of this entity. */
  shotgridId?: string
  /** The Shotgrid Type of this entity. */
  shotgridType?: string
  /** Push changes done to this project to ShotGrid. Requires the transmitter service. */
  shotgridPush?: boolean
}
export type FolderType = {
  name: string
  original_name?: string
  shortName?: string
  icon?: string
}
export type TaskType = {
  name: string
  original_name?: string
  shortName?: string
  color?: string
  icon?: string
}
export type LinkType = {
  link_type: string
  input_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  output_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  color?: string
  style?: 'solid' | 'dashed'
}
export type Status = {
  name: string
  original_name?: string
  shortName?: string
  state?: 'not_started' | 'in_progress' | 'done' | 'blocked'
  icon?: string
  color?: string
  /** Limit the status to specific entity types. */
  scope?: string[]
}
export type Tag = {
  name: string
  original_name?: string
  color?: string
}
export type Anatomy = {
  /** Setup root paths for the project */
  roots?: Root[]
  /** Path templates configuration */
  templates?: Templates
  /** Attributes configuration */
  attributes?: ProjectAttribModel
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
}
export type ProjectBundleModel = {
  production?: string
  staging?: string
}
export type ListProjectsItemModel = {
  name: string
  code: string
  active: boolean
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
export type DeployProjectRequestModel = {
  /** Project name */
  name: string
  /** Project code */
  code: string
  /** Project anatomy */
  anatomy: Anatomy
  /** Library project */
  library?: boolean
  /** Assign default users to the project */
  assignUsers?: boolean
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
  data?: Record<string, any>
}
export type ProjectAttribModel2 = {
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
  applications?: string[]
  tools?: string[]
  ftrackId?: string
  ftrackPath?: string
  /** The Shotgrid ID of this entity. */
  shotgridId?: string
  /** The Shotgrid Type of this entity. */
  shotgridType?: string
  /** Push changes done to this project to ShotGrid. Requires the transmitter service. */
  shotgridPush?: boolean
}
export type ProjectModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  code: string
  library?: boolean
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[]
  statuses?: Status[]
  tags?: Tag[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: Record<string, any>
  /** Whether the project is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ProjectPostModel = {
  code: string
  library?: boolean
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[]
  statuses?: Status[]
  tags?: Tag[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: Record<string, any>
  /** Whether the project is active */
  active?: boolean
}
export type ProjectPatchModel = {
  code?: string
  library?: boolean
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[]
  statuses?: Status[]
  tags?: Tag[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: Record<string, any>
  /** Whether the project is active */
  active?: boolean
}
export type ProjectTagsModel = {
  folders?: string[]
  tasks?: string[]
  products?: string[]
  versions?: string[]
  representations?: string[]
  workfiles?: string[]
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
export type PlannerProjectStatusItem = {
  name: string
  code: string
  initialized: boolean
}
export type PlannerProjectStatus = {
  projects?: PlannerProjectStatusItem[]
  initialized: boolean
}
