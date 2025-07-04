import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listFrontendModules: build.query<ListFrontendModulesApiResponse, ListFrontendModulesApiArg>({
      query: () => ({ url: `/api/frontendModules` }),
    }),
    getSites: build.query<GetSitesApiResponse, GetSitesApiArg>({
      query: (queryArg) => ({
        url: `/api/system/sites`,
        params: {
          platform: queryArg.platform,
          hostname: queryArg.hostname,
        },
      }),
    }),
    getSiteInfo: build.query<GetSiteInfoApiResponse, GetSiteInfoApiArg>({
      query: (queryArg) => ({
        url: `/api/info`,
        params: {
          full: queryArg.full,
        },
      }),
    }),
    getProductionMetrics: build.query<GetProductionMetricsApiResponse, GetProductionMetricsApiArg>({
      query: (queryArg) => ({
        url: `/api/metrics`,
        params: {
          system: queryArg.system,
          saturated: queryArg.saturated,
        },
      }),
    }),
    getSystemMetrics: build.query<GetSystemMetricsApiResponse, GetSystemMetricsApiArg>({
      query: () => ({ url: `/api/metrics/system` }),
    }),
    getListOfSecrets: build.query<GetListOfSecretsApiResponse, GetListOfSecretsApiArg>({
      query: () => ({ url: `/api/secrets` }),
    }),
    getSecret: build.query<GetSecretApiResponse, GetSecretApiArg>({
      query: (queryArg) => ({ url: `/api/secrets/${queryArg.secretName}` }),
    }),
    saveSecret: build.mutation<SaveSecretApiResponse, SaveSecretApiArg>({
      query: (queryArg) => ({
        url: `/api/secrets/${queryArg.secretName}`,
        method: 'PUT',
        body: queryArg.secret,
      }),
    }),
    deleteSecret: build.mutation<DeleteSecretApiResponse, DeleteSecretApiArg>({
      query: (queryArg) => ({ url: `/api/secrets/${queryArg.secretName}`, method: 'DELETE' }),
    }),
    requestServerRestart: build.mutation<
      RequestServerRestartApiResponse,
      RequestServerRestartApiArg
    >({
      query: () => ({ url: `/api/system/restart`, method: 'POST' }),
    }),
    getRestartRequired: build.query<GetRestartRequiredApiResponse, GetRestartRequiredApiArg>({
      query: () => ({ url: `/api/system/restartRequired` }),
    }),
    setRestartRequired: build.mutation<SetRestartRequiredApiResponse, SetRestartRequiredApiArg>({
      query: (queryArg) => ({
        url: `/api/system/restartRequired`,
        method: 'POST',
        body: queryArg.restartRequiredModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListFrontendModulesApiResponse =
  /** status 200 Successful Response */ FrontendModuleListItem[]
export type ListFrontendModulesApiArg = void
export type GetSitesApiResponse = /** status 200 Successful Response */ SiteInfo[]
export type GetSitesApiArg = {
  platform?: 'windows' | 'linux' | 'darwin'
  hostname?: string
}
export type GetSiteInfoApiResponse = /** status 200 Successful Response */ InfoResponseModel
export type GetSiteInfoApiArg = {
  /** Include frontend-related information */
  full?: boolean
}
export type GetProductionMetricsApiResponse = /** status 200 Successful Response */ Metrics
export type GetProductionMetricsApiArg = {
  /** Collect system metrics */
  system?: boolean
  /** Collect saturated (more granular) metrics */
  saturated?: boolean
}
export type GetSystemMetricsApiResponse = /** status 200 Successful Response */ any
export type GetSystemMetricsApiArg = void
export type GetListOfSecretsApiResponse = /** status 200 Successful Response */ Secret[]
export type GetListOfSecretsApiArg = void
export type GetSecretApiResponse = /** status 200 Successful Response */ Secret
export type GetSecretApiArg = {
  secretName: string
}
export type SaveSecretApiResponse = unknown
export type SaveSecretApiArg = {
  secretName: string
  secret: Secret
}
export type DeleteSecretApiResponse = unknown
export type DeleteSecretApiArg = {
  secretName: string
}
export type RequestServerRestartApiResponse = unknown
export type RequestServerRestartApiArg = void
export type GetRestartRequiredApiResponse =
  /** status 200 Successful Response */ RestartRequiredModel
export type GetRestartRequiredApiArg = void
export type SetRestartRequiredApiResponse = /** status 200 Successful Response */ any
export type SetRestartRequiredApiArg = {
  restartRequiredModel: RestartRequiredModel
}
export type FrontendModuleListItem = {
  addonName: string
  addonVersion: string
  modules: {
    [key: string]: string[]
  }
}
export type SiteInfo = {
  id: string
  platform: 'windows' | 'linux' | 'darwin'
  hostname: string
  version: string
  users: string[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ReleaseInfo = {
  version: string
  buildDate: string
  buildTime: string
  frontendBranch: string
  backendBranch: string
  frontendCommit: string
  backendCommit: string
}
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
}
export type UserModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  attrib?: UserAttribModel
  data?: Record<string, any>
  /** Whether the user is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type AttributeEnumItem = {
  value: string | number | number | boolean
  label: string
  icon?: string
  color?: string
  /** List of project this item is available on */
  projects?: string[]
}
export type AttributeData = {
  /** Type of attribute value */
  type:
    | 'string'
    | 'integer'
    | 'float'
    | 'boolean'
    | 'datetime'
    | 'list_of_strings'
    | 'list_of_integers'
    | 'list_of_any'
    | 'list_of_submodels'
    | 'dict'
  /** Nice, human readable title of the attribute */
  title?: string
  description?: string
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number
  ge?: number | number
  lt?: number | number
  le?: number | number
  minLength?: number
  maxLength?: number
  /** Minimum number of items in list type. */
  minItems?: number
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number
  /** Only for string types. The value must match this regex. */
  regex?: string
  /** List of enum items used for displaying select widgets */
  enum?: AttributeEnumItem[]
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
}
export type AttributeModel = {
  name: string
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
    | 'list'
  )[]
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
  data: AttributeData
}
export type SsoOption = {
  name: string
  hidden?: boolean
  title?: string
  icon?: string
  color?: string
  textColor?: string
  redirectKey?: string
  url: string
  args?: {
    [key: string]: string
  }
  callback: string
}
export type InfoResponseModel = {
  /** Instance specific message to be displayed in the login page */
  motd?: string
  /** URL of the background image for the login page */
  loginPageBackground?: string
  /** URL of the brand logo for the login page */
  loginPageBrand?: string
  /** Information about the current release */
  releaseInfo?: ReleaseInfo
  /** Version of the Ayon API */
  version?: string
  /** Time (seconds) since the server was started */
  uptime?: number
  /** No admin user exists, display 'Create admin user' form */
  noAdminUser?: boolean
  onboarding?: boolean
  /** If set, the changelog will not be shown to the user */
  disableChangelog?: boolean
  passwordRecoveryAvailable?: boolean
  user?: UserModel
  attributes?: AttributeModel[]
  sites?: SiteInfo[]
  ssoOptions?: SsoOption[]
  extras?: string
}
export type SystemMetricsData = {
  cpuUsage?: number
  memoryUsage?: number
  swapUsage?: number
  uptimeSeconds?: number
  runtimeSeconds?: number
  dbSizeShared?: number
  dbSizeTotal?: number
  dbAvailableConnections?: number
  redisSizeTotal?: number
  storageUtilizationTotal?: number
}
export type UserCounts = {
  total?: number
  active?: number
  admins?: number
  managers?: number
  services?: number
  licensesTotal?: number
  licensesUsed?: number
}
export type ProjectCounts = {
  total?: number
  active?: number
}
export type ProjectMetrics = {
  nickname: string
  folderCount?: number
  productCount?: number
  versionCount?: number
  representationCount?: number
  taskCount?: number
  workfileCount?: number
  rootCount?: number
  teamCount?: number
  /** Duration in days */
  duration?: number
  dbSize?: number
  storageUtilization?: number
  /** List of folder types in the project. Collected only in the 'saturated' mode. */
  folderTypes?: string[]
  /** List of task types in the project. Collected only in the 'saturated' mode. */
  taskTypes?: string[]
  /** List of statuses in the project. Collected only in the 'saturated' mode. */
  statuses?: string[]
}
export type ProductionBundle = {
  addons?: {
    [key: string]: string
  }
  launcherVersion?: string
}
export type SettingsOverrides = {
  addonName?: string
  addonVersion?: string
  /** List of paths to settings, which have a studio override */
  paths?: string[][]
}
export type ServiceInfo = {
  addonName: string
  addonVersion: string
  serviceName: string
}
export type TrafficStat = {
  date: string
  service: string
  ingress: number
  egress: number
}
export type UserStat = {
  date: string
  users: {
    [key: string]: string
  }
}
export type Metrics = {
  version?: string
  /** Information about the branch and commit of the current release */
  releaseInfo?: ReleaseInfo
  /** Time (seconds) since the server was (re)started */
  uptime?: number
  /** System metrics data
    Contains information about machine utilization,
    and database sizes.
     */
  system?: SystemMetricsData
  /** Number of total and active users, admins and managers */
  userCounts?: UserCounts
  /** Number of total and active projects */
  projectCounts?: ProjectCounts
  /** Project specific metrics
    
    Contain information about size and usage of each active project.
     */
  projects?: ProjectMetrics[]
  /** Average number of events per project
    
    This disregards projects with less than 300 events
    (such as testing projects).
     */
  averageProjectEventCount?: number
  /** Addons and their versions installed on the server
    
    We track what addons are installed on the server, and compare this to the
    addons which are actually used in the production bundle.
     */
  installedAddons?: any[][]
  /** Return the count of events per topic.
    
    This helps us with optimization of event clean-up,
    and other maintenance tasks.
     */
  eventTopics?: {
    [key: string]: number
  }
  /** Addons and their versions used in the production bundle
    
    We track what addons are used in the production bundle, as well as what
    launcher version is used. This is used to determine if the production
    bundle is up to date with the latest addons and launcher version,
    and if not, to notify the user that they should update in case of
    security issues or other important changes.
     */
  productionBundle?: ProductionBundle
  /** Studio settings overrides
    
    We track what settings are overridden in the studio settings.
    This helps us determine, which settins are used the most and which
    settings are not used at all. This is used to determine how we should
    organize the settings in the UI and how the settings could be improved.
     */
  studioSettingsOverrides?: SettingsOverrides[]
  /** List of active services */
  services?: ServiceInfo[]
  trafficStats?: TrafficStat[]
  userStats?: UserStat[]
}
export type Secret = {
  name?: string
  value?: string
}
export type RestartRequiredModel = {
  /** Whether the server requires a restart */
  required: boolean
  /** The reason for the restart */
  reason?: string
}
