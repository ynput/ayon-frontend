import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProjectFile: build.query<GetProjectFileApiResponse, GetProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
      }),
    }),
    getProjectFileHead: build.mutation<GetProjectFileHeadApiResponse, GetProjectFileHeadApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'HEAD',
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
        params: { days: queryArg.days },
      }),
    }),
    getProjectTeams: build.query<GetProjectTeamsApiResponse, GetProjectTeamsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/users` }),
    }),
    getProjectAnatomy: build.query<GetProjectAnatomyApiResponse, GetProjectAnatomyApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/anatomy` }),
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
    getProject: build.query<GetProjectApiResponse, GetProjectApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}` }),
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
    getProjectSiteRoots: build.query<GetProjectSiteRootsApiResponse, GetProjectSiteRootsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/siteRoots`,
        headers: { 'x-ayon-site-id': queryArg['x-ayon-site-id'] },
        params: { platform: queryArg.platform },
      }),
    }),
    getProjectUsers: build.query<GetProjectUsersApiResponse, GetProjectUsersApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/users` }),
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
export type GetProjectFileApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileApiArg = {
  fileId: string
  projectName: string
}
export type GetProjectFileHeadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileHeadApiArg = {
  fileId: string
  projectName: string
}
export type GetProjectFilePayloadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFilePayloadApiArg = {
  fileId: string
  projectName: string
}
export type GetProjectFileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileThumbnailApiArg = {
  fileId: string
  projectName: string
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
export type GetProjectAnatomyApiResponse = /** status 200 Successful Response */ ProjectAnatomy
export type GetProjectAnatomyApiArg = {
  projectName: string
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
export type GetProjectApiResponse = /** status 200 Successful Response */ ProjectModel
export type GetProjectApiArg = {
  projectName: string
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
export type GetProjectSiteRootsApiResponse = /** status 200 Successful Response */ {
  [key: string]: string
}
export type GetProjectSiteRootsApiArg = {
  projectName: string
  platform?: 'windows' | 'linux' | 'darwin'
  /** Site ID may be specified either as a query parameter (`site_id` or `site`) or in a header. */
  'x-ayon-site-id'?: string
}
export type GetProjectUsersApiResponse = /** status 200 Successful Response */ {
  [key: string]: string[]
}
export type GetProjectUsersApiArg = {
  projectName: string
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
}
export type HttpValidationError = {
  detail?: ValidationError[]
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
}
export type FolderType = {
  name: string
  shortName?: string
  icon?: string
  original_name?: string
}
export type TaskType = {
  name: string
  shortName?: string
  icon?: string
  original_name?: string
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
  shortName?: string
  state?: 'not_started' | 'in_progress' | 'done' | 'blocked'
  icon?: string
  color?: string
  /** Limit the status to specific entity types. */
  scope?: string[]
  original_name?: string
}
export type Tag = {
  name: string
  color?: string
  original_name?: string
}
export type ProjectAnatomy = {
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
  data?: object
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
}
export type ProjectModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  code: string
  library?: boolean
  folderTypes?: any[]
  taskTypes?: any[]
  linkTypes?: LinkTypeModel[]
  statuses?: any[]
  /** List of tags available to set on entities. */
  tags?: any[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: object
  /** Whether the project is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
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
