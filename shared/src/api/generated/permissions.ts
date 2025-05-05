import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMyPermissions: build.query<GetMyPermissionsApiResponse, GetMyPermissionsApiArg>({
      query: () => ({ url: `/api/users/me/permissions` }),
    }),
    getMyProjectPermissions: build.query<
      GetMyProjectPermissionsApiResponse,
      GetMyProjectPermissionsApiArg
    >({
      query: (queryArg) => ({ url: `/api/users/me/permissions/${queryArg.projectName}` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetMyPermissionsApiResponse = /** status 200 Successful Response */ UserPermissionsModel
export type GetMyPermissionsApiArg = void
export type GetMyProjectPermissionsApiResponse =
  /** status 200 Successful Response */ ProjectPermissions
export type GetMyProjectPermissionsApiArg = {
  projectName: string
}
export type StudioManagementPermissions = {
  /** Allow users to create new projects */
  create_projects?: boolean
  /** Allow users to list all users in the studio */
  list_all_users?: boolean
}
export type ProjectManagementPermissions = {
  /** Allow users to view or edit the project anatomy */
  anatomy?: number
  /** Allow users to view or assign users to project access groups */
  access?: number
  /** Allow users to view or edit the project addon settings */
  settings?: number
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
export type AttributeReadAccessList = {
  enabled?: boolean
  attributes?: string[]
}
export type AttributeWriteAccessList = {
  enabled?: boolean
  attributes?: string[]
}
export type EndpointsAccessList = {
  enabled?: boolean
  endpoints?: string[]
}
export type ProjectPermissions = {
  project?: ProjectManagementPermissions
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
  attrib_read?: AttributeReadAccessList
  /** Whitelist attributes a user can write */
  attrib_write?: AttributeWriteAccessList
  /** Whitelist REST endpoints a user can access */
  endpoints?: EndpointsAccessList
}
export type UserPermissionsModel = {
  user_level?: 'admin' | 'manager' | 'user'
  /** Permissions for the studio */
  studio?: StudioManagementPermissions
  /** Permissions for individual projects */
  projects?: {
    [key: string]: ProjectPermissions
  }
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
