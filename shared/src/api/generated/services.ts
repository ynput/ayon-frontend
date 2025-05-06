import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listServices: build.query<ListServicesApiResponse, ListServicesApiArg>({
      query: () => ({ url: `/api/services` }),
    }),
    spawnService: build.mutation<SpawnServiceApiResponse, SpawnServiceApiArg>({
      query: (queryArg) => ({
        url: `/api/services/${queryArg.name}`,
        method: 'PUT',
        body: queryArg.spawnServiceRequestModel,
      }),
    }),
    deleteService: build.mutation<DeleteServiceApiResponse, DeleteServiceApiArg>({
      query: (queryArg) => ({ url: `/api/services/${queryArg.name}`, method: 'DELETE' }),
    }),
    patchService: build.mutation<PatchServiceApiResponse, PatchServiceApiArg>({
      query: (queryArg) => ({
        url: `/api/services/${queryArg.serviceName}`,
        method: 'PATCH',
        body: queryArg.patchServiceRequestModel,
      }),
    }),
    listHosts: build.query<ListHostsApiResponse, ListHostsApiArg>({
      query: () => ({ url: `/api/hosts` }),
    }),
    hostHeartbeat: build.mutation<HostHeartbeatApiResponse, HostHeartbeatApiArg>({
      query: (queryArg) => ({
        url: `/api/hosts/heartbeat`,
        method: 'POST',
        body: queryArg.heartbeatRequestModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListServicesApiResponse = /** status 200 Successful Response */ ServiceListModel
export type ListServicesApiArg = void
export type SpawnServiceApiResponse = unknown
export type SpawnServiceApiArg = {
  name: string
  spawnServiceRequestModel: SpawnServiceRequestModel
}
export type DeleteServiceApiResponse = unknown
export type DeleteServiceApiArg = {
  name: string
}
export type PatchServiceApiResponse = unknown
export type PatchServiceApiArg = {
  serviceName: string
  patchServiceRequestModel: PatchServiceRequestModel
}
export type ListHostsApiResponse = /** status 200 Successful Response */ HostListResponseModel
export type ListHostsApiArg = void
export type HostHeartbeatApiResponse = /** status 200 Successful Response */ HeartbeatResponseModel
export type HostHeartbeatApiArg = {
  heartbeatRequestModel: HeartbeatRequestModel
}
export type ServiceDataModel = {
  volumes?: string[]
  ports?: string[]
  memLimit?: string
  user?: string
  env?: object
  storagePath?: string
  image?: string
}
export type ServiceModel = {
  name: string
  hostname: string
  addonName: string
  addonVersion: string
  service: string
  shouldRun: boolean
  isRunning: boolean
  lastSeen?: string
  lastSeenDelta?: number
  data?: ServiceDataModel
}
export type ServiceListModel = {
  services?: ServiceModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ServiceConfigModel = {
  volumes?: string[]
  ports?: string[]
  memLimit?: string
  user?: string
  env?: object
  storagePath?: string
}
export type SpawnServiceRequestModel = {
  addonName: string
  addonVersion: string
  service: string
  hostname: string
  config?: ServiceConfigModel
}
export type PatchServiceRequestModel = {
  volumes?: string[]
  ports?: string[]
  memLimit?: string
  user?: string
  env?: object
  storagePath?: string
  shouldRun?: boolean
  hostname?: string
  /** Deprecated, use top level fields instead */
  config?: ServiceConfigModel
}
export type HostHealthModel = {
  cpu?: number
  mem?: number
}
export type HostModel = {
  name: string
  lastSeen: string
  health?: HostHealthModel
}
export type HostListResponseModel = {
  /** List of registered hosts */
  hosts?: HostModel[]
}
export type HeartbeatResponseModel = {
  services?: ServiceModel[]
}
export type HeartbeatRequestModel = {
  hostname: string
  health: HostHealthModel
  services?: string[]
}
