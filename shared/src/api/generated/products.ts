import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProduct: build.query<GetProductApiResponse, GetProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
      }),
    }),
    deleteProduct: build.mutation<DeleteProductApiResponse, DeleteProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateProduct: build.mutation<UpdateProductApiResponse, UpdateProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}`,
        method: 'PATCH',
        body: queryArg.productPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    createProduct: build.mutation<CreateProductApiResponse, CreateProductApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products`,
        method: 'POST',
        body: queryArg.productPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
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
export type DeleteProductApiResponse = unknown
export type DeleteProductApiArg = {
  projectName: string
  productId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateProductApiResponse = unknown
export type UpdateProductApiArg = {
  projectName: string
  productId: string
  'x-sender'?: string
  'x-sender-type'?: string
  productPatchModel: ProductPatchModel
}
export type CreateProductApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateProductApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
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
export type ProductAttribModel = {
  productGroup?: string
  /** Textual description of the entity */
  description?: string
}
export type ProductModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** Name of the product */
  name: string
  /** ID of the parent folder */
  folderId: string
  /** Product type */
  productType: string
  /** Product base type */
  productBaseType?: string
  path?: string
  attrib?: ProductAttribModel
  data?: Record<string, any>
  /** Whether the product is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the product */
  status?: string
  /** Tags assigned to the the product */
  tags?: string[]
  /** Who created the product */
  createdBy?: string
  /** Who last updated the product */
  updatedBy?: string
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ProductPatchModel = {
  /** Name of the product */
  name?: string
  /** ID of the parent folder */
  folderId?: string
  /** Product type */
  productType?: string
  /** Product base type */
  productBaseType?: string
  /** Status of the product */
  status?: string
  /** Tags assigned to the the product */
  tags?: string[]
  /** Who created the product */
  createdBy?: string
  /** Who last updated the product */
  updatedBy?: string
  attrib?: ProductAttribModel
  data?: Record<string, any>
  /** Whether the product is active */
  active?: boolean
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type ProductPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** Name of the product */
  name: string
  /** ID of the parent folder */
  folderId: string
  /** Product type */
  productType: string
  /** Product base type */
  productBaseType?: string
  /** Status of the product */
  status?: string
  /** Tags assigned to the the product */
  tags?: string[]
  /** Who created the product */
  createdBy?: string
  /** Who last updated the product */
  updatedBy?: string
  attrib?: ProductAttribModel
  data?: Record<string, any>
  /** Whether the product is active */
  active?: boolean
}
export type ProductTypeListItem = {
  name: string
  baseType?: string
  color?: string
  icon?: string
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
  dependencyPackages?: {
    [key: string]: string
  }
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
