import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAccessGroupSchema: build.query<GetAccessGroupSchemaApiResponse, GetAccessGroupSchemaApiArg>({
      query: (queryArg) => ({
        url: `/api/accessGroups/_schema`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
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
    getShareOptions: build.query<GetShareOptionsApiResponse, GetShareOptionsApiArg>({
      query: (queryArg) => ({
        url: `/api/share`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetAccessGroupSchemaApiResponse = /** status 200 Successful Response */ any
export type GetAccessGroupSchemaApiArg = {
  projectName?: string
}
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
export type GetShareOptionsApiResponse = /** status 200 Successful Response */ ShareOptions
export type GetShareOptionsApiArg = {
  projectName?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type AccessGroupObject = {
  /** Name of the access group */
  name: string
  /** Whether the access group is project level */
  isProjectLevel: boolean
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
  fields?: string[]
}
export type ActionsAccessList = {
  enabled?: boolean
  actions?: string[]
}
export type EntityLinksAccessList = {
  enabled?: boolean
  link_types?: string[]
}
export type EndpointsAccessList = {
  enabled?: boolean
  endpoints?: string[]
}
export type ProjectAdvancedPermissions = {
  /** If a user can access a task through the 'Assigned' permission, enabling this will also show all sibling tasks in the same folder. When disabled, only the assigned task is visible. */
  show_sibling_tasks?: boolean
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
  /** Whitelist actions a user can perform */
  actions?: ActionsAccessList
  /** Whitelist link types a user can create between entities */
  links?: EntityLinksAccessList
  /** Whitelist REST endpoints a user can access */
  endpoints?: EndpointsAccessList
  advanced?: ProjectAdvancedPermissions
}
export type ShareOption = {
  shareType: string
  value: string
  name: string
  label: string
  attribute?: string
}
export type ShareOptions = {
  options: ShareOption[]
}
