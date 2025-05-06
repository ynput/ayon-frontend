import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUserPools: build.query<GetUserPoolsApiResponse, GetUserPoolsApiArg>({
      query: () => ({ url: `/api/auth/pools` }),
    }),
    getUserApiKeys: build.query<GetUserApiKeysApiResponse, GetUserApiKeysApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/apikeys` }),
    }),
    createUserApiKey: build.mutation<CreateUserApiKeyApiResponse, CreateUserApiKeyApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/apikeys`,
        method: 'POST',
        body: queryArg.apiKeyPostModel,
      }),
    }),
    deleteUserApiKey: build.mutation<DeleteUserApiKeyApiResponse, DeleteUserApiKeyApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/apikeys/${queryArg.entityId}`,
        method: 'DELETE',
      }),
    }),
    updateUserApiKey: build.mutation<UpdateUserApiKeyApiResponse, UpdateUserApiKeyApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/apikeys/${queryArg.entityId}`,
        method: 'PATCH',
        body: queryArg.apiKeyPatchModel,
      }),
    }),
    getAvatar: build.query<GetAvatarApiResponse, GetAvatarApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/avatar` }),
    }),
    uploadAvatar: build.mutation<UploadAvatarApiResponse, UploadAvatarApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/avatar`, method: 'PUT' }),
    }),
    deleteAvatar: build.mutation<DeleteAvatarApiResponse, DeleteAvatarApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/avatar`, method: 'DELETE' }),
    }),
    passwordResetRequest: build.mutation<
      PasswordResetRequestApiResponse,
      PasswordResetRequestApiArg
    >({
      query: (queryArg) => ({
        url: `/api/users/passwordResetRequest`,
        method: 'POST',
        body: queryArg.passwordResetRequestModel,
      }),
    }),
    passwordReset: build.mutation<PasswordResetApiResponse, PasswordResetApiArg>({
      query: (queryArg) => ({
        url: `/api/users/passwordReset`,
        method: 'POST',
        body: queryArg.passwordResetModel,
      }),
    }),
    getMyPermissions: build.query<GetMyPermissionsApiResponse, GetMyPermissionsApiArg>({
      query: () => ({ url: `/api/users/me/permissions` }),
    }),
    getMyProjectPermissions: build.query<
      GetMyProjectPermissionsApiResponse,
      GetMyProjectPermissionsApiArg
    >({
      query: (queryArg) => ({ url: `/api/users/me/permissions/${queryArg.projectName}` }),
    }),
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
    getCurrentUser: build.query<GetCurrentUserApiResponse, GetCurrentUserApiArg>({
      query: () => ({ url: `/api/users/me` }),
    }),
    getUser: build.query<GetUserApiResponse, GetUserApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}` }),
    }),
    createUser: build.mutation<CreateUserApiResponse, CreateUserApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}`,
        method: 'PUT',
        body: queryArg.newUserModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteUser: build.mutation<DeleteUserApiResponse, DeleteUserApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    patchUser: build.mutation<PatchUserApiResponse, PatchUserApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}`,
        method: 'PATCH',
        body: queryArg.userPatchModel,
      }),
    }),
    changePassword: build.mutation<ChangePasswordApiResponse, ChangePasswordApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/password`,
        method: 'PATCH',
        body: queryArg.changePasswordRequestModel,
      }),
    }),
    checkPassword: build.mutation<CheckPasswordApiResponse, CheckPasswordApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/checkPassword`,
        method: 'POST',
        body: queryArg.checkPasswordRequestModel,
      }),
    }),
    changeUserName: build.mutation<ChangeUserNameApiResponse, ChangeUserNameApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/rename`,
        method: 'PATCH',
        body: queryArg.changeUserNameRequestModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    getUserSessions: build.query<GetUserSessionsApiResponse, GetUserSessionsApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/sessions` }),
    }),
    deleteUserSession: build.mutation<DeleteUserSessionApiResponse, DeleteUserSessionApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/sessions/${queryArg.sessionId}`,
        method: 'DELETE',
      }),
    }),
    assignAccessGroups: build.mutation<AssignAccessGroupsApiResponse, AssignAccessGroupsApiArg>({
      query: (queryArg) => ({
        url: `/api/users/${queryArg.userName}/accessGroups`,
        method: 'PATCH',
        body: queryArg.assignAccessGroupsRequestModel,
      }),
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
export type GetUserPoolsApiResponse = /** status 200 Successful Response */ UserPoolModel[]
export type GetUserPoolsApiArg = void
export type GetUserApiKeysApiResponse = /** status 200 Successful Response */ ApiKeyModel[]
export type GetUserApiKeysApiArg = {
  userName: string
}
export type CreateUserApiKeyApiResponse = /** status 200 Successful Response */ any
export type CreateUserApiKeyApiArg = {
  userName: string
  apiKeyPostModel: ApiKeyPostModel
}
export type DeleteUserApiKeyApiResponse = /** status 200 Successful Response */ any
export type DeleteUserApiKeyApiArg = {
  userName: string
  entityId: string
}
export type UpdateUserApiKeyApiResponse = /** status 200 Successful Response */ any
export type UpdateUserApiKeyApiArg = {
  userName: string
  entityId: string
  apiKeyPatchModel: ApiKeyPatchModel
}
export type GetAvatarApiResponse = /** status 200 Successful Response */ any
export type GetAvatarApiArg = {
  userName: string
}
export type UploadAvatarApiResponse = /** status 200 Successful Response */ any
export type UploadAvatarApiArg = {
  userName: string
}
export type DeleteAvatarApiResponse = /** status 200 Successful Response */ any
export type DeleteAvatarApiArg = {
  userName: string
}
export type PasswordResetRequestApiResponse = /** status 200 Successful Response */ any
export type PasswordResetRequestApiArg = {
  passwordResetRequestModel: PasswordResetRequestModel
}
export type PasswordResetApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type PasswordResetApiArg = {
  passwordResetModel: PasswordResetModel
}
export type GetMyPermissionsApiResponse = /** status 200 Successful Response */ UserPermissionsModel
export type GetMyPermissionsApiArg = void
export type GetMyProjectPermissionsApiResponse =
  /** status 200 Successful Response */ ProjectPermissions
export type GetMyProjectPermissionsApiArg = {
  projectName: string
}
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
export type GetCurrentUserApiResponse = /** status 200 Successful Response */ UserModel
export type GetCurrentUserApiArg = void
export type GetUserApiResponse =
  /** status 200 Successful Response */
  | UserModel
  | {
      [key: string]: string
    }
export type GetUserApiArg = {
  userName: string
}
export type CreateUserApiResponse = /** status 200 Successful Response */ any
export type CreateUserApiArg = {
  userName: string
  'x-sender'?: string
  'x-sender-type'?: string
  newUserModel: NewUserModel
}
export type DeleteUserApiResponse = /** status 200 Successful Response */ any
export type DeleteUserApiArg = {
  userName: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type PatchUserApiResponse = /** status 200 Successful Response */ any
export type PatchUserApiArg = {
  userName: string
  userPatchModel: UserPatchModel
}
export type ChangePasswordApiResponse = /** status 200 Successful Response */ any
export type ChangePasswordApiArg = {
  userName: string
  changePasswordRequestModel: ChangePasswordRequestModel
}
export type CheckPasswordApiResponse = /** status 200 Successful Response */ any
export type CheckPasswordApiArg = {
  userName: string
  checkPasswordRequestModel: CheckPasswordRequestModel
}
export type ChangeUserNameApiResponse = /** status 200 Successful Response */ any
export type ChangeUserNameApiArg = {
  userName: string
  'x-sender'?: string
  'x-sender-type'?: string
  changeUserNameRequestModel: ChangeUserNameRequestModel
}
export type GetUserSessionsApiResponse =
  /** status 200 Successful Response */ UserSessionsResponseModel
export type GetUserSessionsApiArg = {
  userName: string
}
export type DeleteUserSessionApiResponse = /** status 200 Successful Response */ any
export type DeleteUserSessionApiArg = {
  sessionId: string
  userName: string
}
export type AssignAccessGroupsApiResponse = /** status 200 Successful Response */ any
export type AssignAccessGroupsApiArg = {
  userName: string
  assignAccessGroupsRequestModel: AssignAccessGroupsRequestModel
}
export type SetFrontendPreferencesApiResponse = /** status 200 Successful Response */ any
export type SetFrontendPreferencesApiArg = {
  userName: string
  patchData: object
}
export type UserPoolModel = {
  id: string
  label: string
  type: 'fixed' | 'metered'
  valid: boolean
  note: string
  exp: number
  max: number
  used: number
}
export type ApiKeyModel = {
  id: string
  label: string
  preview: string
  created: number
  expires?: number
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ApiKeyPostModel = {
  label: string
  key: string
  expires?: number
}
export type ApiKeyPatchModel = {
  label?: string
  expires?: number
}
export type PasswordResetRequestModel = {
  email: string
  url: string
}
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
  freelancer?: boolean
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
export type LoginResponseModel = {
  detail?: string
  error?: string
  token?: string
  user?: UserModel
}
export type PasswordResetModel = {
  token: string
  password?: string
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
export type StudioPermissions = {
  studio?: StudioManagementPermissions
}
export type NewUserModel = {
  attrib?: UserAttribModel
  data?: Record<string, any>
  /** Whether the user is active */
  active?: boolean
  /** Password for the new user */
  password?: string
  /** API Key for the new service user */
  apiKey?: string
}
export type UserPatchModel = {
  attrib?: UserAttribModel
  data?: Record<string, any>
  /** Whether the user is active */
  active?: boolean
}
export type ChangePasswordRequestModel = {
  /** New password */
  password?: string
  /** API Key to set to a service user */
  apiKey?: string
}
export type CheckPasswordRequestModel = {
  password: string
}
export type ChangeUserNameRequestModel = {
  /** New user name */
  newName: string
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
export type AccessGroupsOnProject = {
  /** Project name */
  project: string
  /** List of access groups on the project */
  accessGroups: string[]
}
export type AssignAccessGroupsRequestModel = {
  /** List of access groups to assign */
  accessGroups?: AccessGroupsOnProject[]
}
