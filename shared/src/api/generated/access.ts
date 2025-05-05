import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAccessGroupSchema: build.query<GetAccessGroupSchemaApiResponse, GetAccessGroupSchemaApiArg>({
      query: () => ({ url: `/api/accessGroups/_schema` }),
    }),
    getAccessGroups: build.query<GetAccessGroupsApiResponse, GetAccessGroupsApiArg>({
      query: (queryArg) => ({ url: `/api/accessGroups/${queryArg.projectName}` }),
    }),
    getAccessGroup: build.query<GetAccessGroupApiResponse, GetAccessGroupApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/${queryArg.accessGroupName}/${queryArg.projectName}`,
      }),
    }),
    saveAccessGroup: build.mutation<SaveAccessGroupApiResponse, SaveAccessGroupApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/${queryArg.accessGroupName}/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.data,
      }),
    }),
    deleteAccessGroup: build.mutation<DeleteAccessGroupApiResponse, DeleteAccessGroupApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/${queryArg.accessGroupName}/${queryArg.projectName}`,
        method: 'DELETE',
      }),
    }),
    setProjectsAccess: build.mutation<SetProjectsAccessApiResponse, SetProjectsAccessApiArg>({
      query: (queryArg) => ({ url: `/api/access`, method: 'POST', body: queryArg.payload }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetAccessGroupSchemaApiResponse = /** status 200 Successful Response */ any
export type GetAccessGroupSchemaApiArg = void
export type GetAccessGroupsApiResponse = /** status 200 Successful Response */ AccessGroupObject[]
export type GetAccessGroupsApiArg = {
  projectName: string
}
export type GetAccessGroupApiResponse = /** status 200 Successful Response */ Permissions
export type GetAccessGroupApiArg = {
  accessGroupName: string
  projectName: string
}
export type SaveAccessGroupApiResponse = unknown
export type SaveAccessGroupApiArg = {
  accessGroupName: string
  projectName: string
  data: Permissions
}
export type DeleteAccessGroupApiResponse = unknown
export type DeleteAccessGroupApiArg = {
  accessGroupName: string
  projectName: string
}
export type SetProjectsAccessApiResponse = /** status 200 Successful Response */ any
export type SetProjectsAccessApiArg = {
  payload: {
    [key: string]: {
      [key: string]: string[]
    }
  }
}
export type AccessGroupObject = {
  /** Name of the access group */
  name: string
  /** Whether the access group is project level */
  isProjectLevel: boolean
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
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
export type Permissions = {
  studio?: StudioManagementPermissions
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
