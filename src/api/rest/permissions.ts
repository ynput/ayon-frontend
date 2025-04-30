import { RestAPI as api } from '@shared/api'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCurrentUserPermissions: build.query<
      GetCurrentUserPermissionsApiResponse,
      GetCurrentUserPermissionsApiArg
    >({
      query: () => ({ url: `/api/users/me/permissions` }),
    }),
    getCurrentUserProjectPermissions: build.query<
      GetCurrentUserProjectPermissionsApiResponse,
      GetCurrentUserProjectPermissionsApiArg
    >({
      query: (queryArg) => ({ url: `/api/users/me/permissions/${queryArg.projectName}` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetCurrentUserPermissionsApiResponse = /** status 200 Successful Response */ any
export type GetCurrentUserPermissionsApiArg = void
export type GetCurrentUserProjectPermissionsApiResponse =
  /** status 200 Successful Response */ Permissions
export type GetCurrentUserProjectPermissionsApiArg = {
  projectName: string
}
export type ErrorResponse = {
  code: number
  detail: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type StudioSettingsAccessModel = {
  enabled?: boolean
  /** List of addons a user can access */
  addons?: string[]
}
export type ProjectSettingsAccessModel = {
  enabled?: boolean
  /** List of addons a user can access */
  addons?: string[]
  /** Allow users to update the project anatomy */
  anatomy_update?: boolean
}
export type FolderAccess = {
  access_type?: string
  /** The path of the folder to allow access to. Required for access_type 'hierarchy and 'children' */
  path?: string
}
export type FolderAccessList = {
  enabled?: boolean
  access_list?: FolderAccess[]
}
export type AttributeAccessList = {
  enabled?: boolean
  attributes?: string[]
}
export type EndpointsAccessList = {
  enabled?: boolean
  endpoints?: string[]
}
export type Permissions = {
  /** Restrict access to studio settings */
  studio_settings?: StudioSettingsAccessModel
  /** Restrict write access to project settings */
  project_settings?: ProjectSettingsAccessModel
  /** Whitelist folders a user can create */
  create?: FolderAccessList
  /** Whitelist folders a user can read */
  read?: FolderAccessList
  /** Whitelist folders a user can update */
  update?: FolderAccessList
  /** Whitelist folders a user can publish to */
  publish?: FolderAccessList
  /** Whitelist folders a user can delete */
  delete?: FolderAccessList
  /** Whitelist attributes a user can read */
  attrib_read?: AttributeAccessList
  /** Whitelist attributes a user can write */
  attrib_write?: AttributeAccessList
  /** Whitelist REST endpoints a user can access */
  endpoints?: EndpointsAccessList
}
