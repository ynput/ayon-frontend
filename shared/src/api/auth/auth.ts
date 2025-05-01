import { BaseAPI as api } from '@shared/client'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createSession: build.mutation<CreateSessionApiResponse, CreateSessionApiArg>({
      query: (queryArg) => ({
        url: `/api/auth/sessions`,
        method: 'POST',
        body: queryArg.createSessionRequest,
      }),
    }),
    getUserPools: build.query<GetUserPoolsApiResponse, GetUserPoolsApiArg>({
      query: () => ({ url: `/api/auth/pools` }),
    }),
    getSiteInfo: build.query<GetSiteInfoApiResponse, GetSiteInfoApiArg>({
      query: (queryArg) => ({
        url: `/api/info`,
        params: {
          full: queryArg.full,
        },
      }),
    }),
    getCurrentUser: build.query<GetCurrentUserApiResponse, GetCurrentUserApiArg>({
      query: () => ({ url: `/api/users/me` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type CreateSessionApiResponse = /** status 200 Successful Response */ SessionModel
export type CreateSessionApiArg = {
  createSessionRequest: CreateSessionRequest
}
export type GetUserPoolsApiResponse = /** status 200 Successful Response */ UserPoolModel[]
export type GetUserPoolsApiArg = void
export type GetSiteInfoApiResponse = /** status 200 Successful Response */ InfoResponseModel
export type GetSiteInfoApiArg = {
  /** Include frontend-related information */
  full?: boolean
}
export type GetCurrentUserApiResponse = /** status 200 Successful Response */ UserModel
export type GetCurrentUserApiArg = void
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
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
export type SessionModel = {
  user: UserModel
  token: string
  created?: number
  lastUsed?: number
  isService?: boolean
  isApiKey?: boolean
  clientInfo?: ClientInfo
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type CreateSessionRequest = {
  /** User name to create session for */
  userName?: string
  /** Message to log in event stream */
  message?: string
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
export type ReleaseInfo = {
  version: string
  buildDate: string
  buildTime: string
  frontendBranch: string
  backendBranch: string
  frontendCommit: string
  backendCommit: string
}
export type AttributeEnumItem = {
  value: string | number | number | boolean
  label: string
  icon?: string
  color?: string
}
export type AttributeData = {
  /** Type of attribute value */
  type:
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
  title?: string
  description?: string
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number
  ge?: number | number
  lt?: number | number
  le?: number | number
  minLength?: number
  maxLength?: number
  /** Minimum number of items in list type. */
  minItems?: number
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number
  /** Only for string types. The value must match this regex. */
  regex?: string
  /** List of enum items used for displaying select/multiselect widgets */
  enum?: AttributeEnumItem[]
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
}
export type AttributeModel = {
  name: string
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
  )[]
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
  data: AttributeData
}
export type SiteInfo = {
  id: string
  platform: 'windows' | 'linux' | 'darwin'
  hostname: string
  version: string
  users: string[]
}
export type SsoOption = {
  name: string
  title?: string
  icon?: string
  color?: string
  textColor?: string
  redirectKey?: string
  url: string
  args?: {
    [key: string]: string
  }
  callback: string
}
export type InfoResponseModel = {
  /** Instance specific message to be displayed in the login page */
  motd?: string
  /** URL of the background image for the login page */
  loginPageBackground?: string
  /** URL of the brand logo for the login page */
  loginPageBrand?: string
  /** Information about the current release */
  releaseInfo?: ReleaseInfo
  /** Version of the Ayon API */
  version?: string
  /** Time (seconds) since the server was started */
  uptime?: number
  /** No admin user exists, display 'Create admin user' form */
  noAdminUser?: boolean
  onboarding?: boolean
  passwordRecoveryAvailable?: boolean
  user?: UserModel
  attributes?: AttributeModel[]
  sites?: SiteInfo[]
  ssoOptions?: SsoOption[]
  extras?: string
}
export type ErrorResponse = {
  code: number
  detail: string
}
