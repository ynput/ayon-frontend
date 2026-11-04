import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProduct: build.query<GetProductApiResponse, GetProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
      }),
    }),
    updateProduct: build.mutation<UpdateProductApiResponse, UpdateProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
        method: 'PATCH',
        body: queryArg.productPatchModel,
      }),
    }),
    deleteProduct: build.mutation<DeleteProductApiResponse, DeleteProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
        method: 'DELETE',
      }),
    }),
    createProduct: build.mutation<CreateProductApiResponse, CreateProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products`,
        method: 'POST',
        body: queryArg.productPostModel,
      }),
    }),
    getProductTypes: build.query<GetProductTypesApiResponse, GetProductTypesApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/productTypes` }),
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetProductApiResponse = /** status 200 Successful Response */ ProductModel
export type GetProductApiArg = {
  projectName: string
  productId: string
}
export type UpdateProductApiResponse = unknown
export type UpdateProductApiArg = {
  projectName: string
  productId: string
  productPatchModel: ProductPatchModel
}
export type DeleteProductApiResponse = unknown
export type DeleteProductApiArg = {
  projectName: string
  productId: string
}
export type CreateProductApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateProductApiArg = {
  projectName: string
  productPostModel: ProductPostModel
}
export type GetProductTypesApiResponse = /** status 200 Successful Response */ ProductTypesList
export type GetProductTypesApiArg = {
  projectName: string
}
export type GetProductionMetricsApiResponse = /** status 200 Successful Response */ Metrics
export type GetProductionMetricsApiArg = {
  /** Collect system metrics */
  system?: boolean
  /** Collect saturated (more granular) metrics */
  saturated?: boolean
}
export type ProductModel = {
  /** Unique identifier of the entity */
  id?: string
  /** Name of the product */
  name: string
  /** ID of the parent folder */
  folderId: string
  /** Product type */
  productType: string
  /** Product base type */
  productBaseType?: string | null
  path?: string | null
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
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
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
export type ProductPatchModel = {
  /** Name of the product */
  name?: string | null
  /** ID of the parent folder */
  folderId?: string | null
  /** Product type */
  productType?: string | null
  /** Product base type */
  productBaseType?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[] | null
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
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
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type ProductPostModel = {
  /** Unique identifier of the entity */
  id?: string
  /** Name of the product */
  name: string
  /** ID of the parent folder */
  folderId: string
  /** Product type */
  productType: string
  /** Product base type */
  productBaseType?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
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
export type ReleaseInfo = {
  version: string
  buildDate: string
  buildTime: string
  frontendBranch: string
  backendBranch: string
  frontendCommit: string
  backendCommit: string
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
