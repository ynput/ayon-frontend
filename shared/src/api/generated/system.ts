import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSystemDeprecations: build.query<
      GetSystemDeprecationsApiResponse,
      GetSystemDeprecationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/system/deprecations`,
        params: {
          latest: queryArg.latest,
        },
      }),
    }),
    listFrontendModules: build.query<ListFrontendModulesApiResponse, ListFrontendModulesApiArg>({
      query: (queryArg) => ({
        url: `/api/frontendModules`,
        params: {
          variant: queryArg.variant,
        },
      }),
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
    deleteSite: build.mutation<DeleteSiteApiResponse, DeleteSiteApiArg>({
      query: (queryArg) => ({ url: `/api/system/sites/${queryArg.siteId}`, method: 'DELETE' }),
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
    getTracemallocMetrics: build.query<
      GetTracemallocMetricsApiResponse,
      GetTracemallocMetricsApiArg
    >({
      query: () => ({ url: `/api/metrics/tracemalloc` }),
    }),
    stopTracemallocMetrics: build.mutation<
      StopTracemallocMetricsApiResponse,
      StopTracemallocMetricsApiArg
    >({
      query: () => ({ url: `/api/metrics/tracemalloc`, method: 'DELETE' }),
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
export type GetSystemDeprecationsApiResponse =
  /** status 200 Successful Response */ DeprecationsModel
export type GetSystemDeprecationsApiArg = {
  /** Only report the latest version of each addon */
  latest?: boolean
}
export type ListFrontendModulesApiResponse =
  /** status 200 Successful Response */ FrontendModuleListItem[]
export type ListFrontendModulesApiArg = {
  /** production, staging, or developer (the user's dev bundle) */
  variant?: string
}
export type GetSitesApiResponse = /** status 200 Successful Response */ SiteInfo[]
export type GetSitesApiArg = {
  platform?: ('windows' | 'linux' | 'darwin') | null
  hostname?: string | null
}
export type DeleteSiteApiResponse = /** status 200 Successful Response */ any
export type DeleteSiteApiArg = {
  siteId: string
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
export type GetTracemallocMetricsApiResponse = /** status 200 Successful Response */ any
export type GetTracemallocMetricsApiArg = void
export type StopTracemallocMetricsApiResponse = /** status 200 Successful Response */ any
export type StopTracemallocMetricsApiArg = void
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
export type DeprecationItem = {
  category: string
  message: string
  /** Path relative to the addon or server directory */
  file: string
  line: number
  /** How many times the deprecated feature was used */
  count: number
}
export type AddonDeprecations = {
  addonName: string
  addonVersion: string
  deprecations?: DeprecationItem[]
}
export type DeprecationsModel = {
  /** Deprecated features used by the server itself */
  server?: DeprecationItem[]
  /** Deprecated features used by the addons */
  addons?: AddonDeprecations[]
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
export type ReleaseInfo = {
  version: string
  buildDate: string
  buildTime: string
  frontendBranch: string
  backendBranch: string
  frontendCommit: string
  backendCommit: string
}
export type UserModel = {
  /** Unique name of the user */
  name: string
  uiExposureLevel?: number | null
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
export type AttributeData = {
  /** Type of attribute value */
  type?:
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
  title?: string | null
  description?: string | null
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number | null
  ge?: number | number | null
  lt?: number | number | null
  le?: number | number | null
  minLength?: number | null
  maxLength?: number | null
  /** Minimum number of items in list type. */
  minItems?: number | null
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number | null
  /** Only for string types. The value must match this regex. */
  regex?: string | null
  /** List of enum items used for displaying select widgets */
  enum?: EnumItem[] | null
  /** Name of the function that provides enum values dynamically. */
  enumResolver?: string | null
  /** Settings passed to the enum resolver function. */
  enumResolverSettings?: {
    [key: string]: any
  } | null
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
  /** Specific widget style this field should use. */
  widget?: string | null
  /** Any additional config specific for the widget style.(Date formats, precision etc.) */
  widgetSettings?: {
    [key: string]: any
  } | null
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
  data: AttributeData
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
}
export type SsoOption = {
  /** Unique name of the SSO provider */
  name: string
  /** If True, the provider will not be shown in the UI */
  hidden?: boolean
  /** Nice human-readable title of the provider */
  title?: string | null
  icon?: string | null
  color?: string
  textColor?: string
  redirectKey?: string | null
  url: string
  args?: {
    [key: string]: string
  }
  callback: string
}
export type InfoResponseModel = {
  /** Instance specific message to be displayed in the login page */
  motd?: string | null
  /** URL of the background image for the login page */
  loginPageBackground?: string | null
  /** Replaced by `studio_logo`, kept for backward compatibility */
  loginPageBrand?: string | null
  /** URL of the brand logo for the login page */
  studioLogo?: string | null
  /** Information about the current release */
  releaseInfo?: ReleaseInfo | null
  /** Version of the Ayon API */
  version?: string
  /** Time (seconds) since the server was started */
  uptime?: number
  /** No admin user exists, display 'Create admin user' form */
  noAdminUser?: boolean | null
  onboarding?: boolean | null
  /** Password authentication will not be shown on the login page */
  hidePasswordAuth?: boolean | null
  passwordRecoveryAvailable?: boolean | null
  user?: UserModel | null
  /** Deprecated. Use the `/api/attributes` endpoint instead. */
  attributes?: AttributeModel[] | null
  sites?: SiteInfo[] | null
  ssoOptions?: SsoOption[] | null
  frontendFlags?: string[] | null
  extras?: string | null
  /** If set, the changelog will not be shown to the user */
  disableChangelog?: boolean | null
  disableFeedback?: boolean | null
  offlineMode?: boolean | null
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
  rootCount?: number | null
  teamCount?: number | null
  /** Duration in days */
  duration?: number | null
  dbSize?: number | null
  storageUtilization?: number | null
  /** List of folder types in the project. Collected only in the 'saturated' mode. */
  folderTypes?: string[] | null
  /** List of task types in the project. Collected only in the 'saturated' mode. */
  taskTypes?: string[] | null
  /** List of statuses in the project. Collected only in the 'saturated' mode. */
  statuses?: string[] | null
}
export type ProductionBundle = {
  addons?: {
    [key: string]: string
  }
  launcherVersion?: string | null
  dependencyPackages?: {
    [key: string]: string | null
  }
}
export type SettingsOverrides = {
  addonName?: string | null
  addonVersion?: string | null
  /** List of paths to settings, which have a studio override */
  paths?: string[][] | null
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
    [key: string]: string | null
  }
}
export type Metrics = {
  version?: string
  /** Information about the branch and commit of the current release */
  releaseInfo?: ReleaseInfo | null
  /** Time (seconds) since the server was (re)started */
  uptime?: number
  /** System metrics data
    Contains information about machine utilization,
    and database sizes.
     */
  system?: SystemMetricsData | null
  /** Number of total and active users, admins and managers */
  userCounts?: UserCounts | null
  /** Number of total and active projects */
  projectCounts?: ProjectCounts | null
  /** Project specific metrics
    
    Contain information about size and usage of each active project.
     */
  projects?: ProjectMetrics[] | null
  /** Average number of events per project
    
    This disregards projects with less than 300 events
    (such as testing projects).
     */
  averageProjectEventCount?: number | null
  /** Addons and their versions installed on the server
    
    We track what addons are installed on the server, and compare this to the
    addons which are actually used in the production bundle.
     */
  installedAddons?: [string, string][] | null
  /** Return the count of events per topic.
    
    This helps us with optimization of event clean-up,
    and other maintenance tasks.
     */
  eventTopics?: {
    [key: string]: number
  } | null
  /** Addons and their versions used in the production bundle
    
    We track what addons are used in the production bundle, as well as what
    launcher version is used. This is used to determine if the production
    bundle is up to date with the latest addons and launcher version,
    and if not, to notify the user that they should update in case of
    security issues or other important changes.
     */
  productionBundle?: ProductionBundle | null
  /** Studio settings overrides
    
    We track what settings are overridden in the studio settings.
    This helps us determine, which settins are used the most and which
    settings are not used at all. This is used to determine how we should
    organize the settings in the UI and how the settings could be improved.
     */
  studioSettingsOverrides?: SettingsOverrides[] | null
  /** List of active services */
  services?: ServiceInfo[] | null
  trafficStats?: TrafficStat[] | null
  userStats?: UserStat[] | null
}
export type Secret = {
  name?: string | null
  value?: string | null
}
export type RestartRequiredModel = {
  /** Whether the server requires a restart */
  required: boolean
  /** The reason for the restart */
  reason?: string | null
}
