import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserStudioPermissions: build.query<
      GetUserStudioPermissionsApiResponse,
      GetUserStudioPermissionsApiArg
    >({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/permissions` }),
    }),
    getUserProjectPermissions: build.query<
      GetUserProjectPermissionsApiResponse,
      GetUserProjectPermissionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/permissions/${queryArg.projectName}`,
      }),
    }),
    getUser: build.query<GetUserApiResponse, GetUserApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}` }),
    }),
    getUserSessions: build.query<GetUserSessionsApiResponse, GetUserSessionsApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/sessions` }),
    }),
    setFrontendPreferences: build.mutation<
      SetFrontendPreferencesApiResponse,
      SetFrontendPreferencesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/frontendPreferences`,
        method: 'PATCH',
        body: queryArg.patchData,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetUserStudioPermissionsApiResponse =
  /** status 200 Successful Response */ StudioPermissions
export type GetUserStudioPermissionsApiArg = {
  userName: string
}
export type GetUserProjectPermissionsApiResponse =
  /** status 200 Successful Response */ ProjectPermissions
export type GetUserProjectPermissionsApiArg = {
  projectName: string
  userName: string
}
export type GetUserApiResponse = /** status 200 Successful Response */
  | UserModel
  | {
      [key: string]: string
    }
export type GetUserApiArg = {
  userName: string
}
export type GetUserSessionsApiResponse =
  /** status 200 Successful Response */ UserSessionsResponseModel
export type GetUserSessionsApiArg = {
  userName: string
}
export type SetFrontendPreferencesApiResponse = /** status 200 Successful Response */ any
export type SetFrontendPreferencesApiArg = {
  userName: string
  patchData: object
}
export type StudioManagementPermissions = {
  /** Allow users to create new projects */
  create_projects?: boolean
  /** Allow users to list all users in the studio */
  list_all_users?: boolean
}
export type StudioPermissions = {
  studio?: StudioManagementPermissions
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
export type AttributeAccessList = {
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
  attrib_read?: AttributeAccessList
  /** Whitelist attributes a user can write */
  attrib_write?: AttributeAccessList
  /** Whitelist REST endpoints a user can access */
  endpoints?: EndpointsAccessList
}
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
  /** Do they live in Olympus */
  god?: boolean
}
export type UserModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  attrib?: UserAttribModel
  data?: object
  /** Whether the user is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type LocationInfo = {
  country?: string
  subdivision?: string
  city?: string
}
export type AgentInfo = {
  platform?: string
  client?: string
  device?: string
}
export type ClientInfo = {
  ip: string
  languages?: string[]
  location?: LocationInfo
  agent?: AgentInfo
  site_id?: string
}
export type UserSessionModel = {
  token: string
  isService: boolean
  lastUsed: number
  clientInfo?: ClientInfo
}
export type UserSessionsResponseModel = {
  sessions: UserSessionModel[]
}
