import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginApiResponse, LoginApiArg>({
      query: (queryArg) => ({
        url: `/api/auth/login`,
        method: 'POST',
        body: queryArg.loginRequestModel,
      }),
    }),
    logout: build.mutation<LogoutApiResponse, LogoutApiArg>({
      query: () => ({ url: `/api/auth/logout`, method: 'POST' }),
    }),
    tokenAuthCallback: build.query<TokenAuthCallbackApiResponse, TokenAuthCallbackApiArg>({
      query: () => ({ url: `/api/auth/tokenauth` }),
    }),
    listActiveSessions: build.query<ListActiveSessionsApiResponse, ListActiveSessionsApiArg>({
      query: () => ({ url: `/api/auth/sessions` }),
    }),
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type LoginApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type LoginApiArg = {
  loginRequestModel: LoginRequestModel
}
export type LogoutApiResponse = /** status 200 Successful Response */ LogoutResponseModel
export type LogoutApiArg = void
export type TokenAuthCallbackApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type TokenAuthCallbackApiArg = void
export type ListActiveSessionsApiResponse = /** status 200 Successful Response */ SessionModel[]
export type ListActiveSessionsApiArg = void
export type CreateSessionApiResponse = /** status 200 Successful Response */ SessionModel
export type CreateSessionApiArg = {
  createSessionRequest: CreateSessionRequest
}
export type GetUserPoolsApiResponse = /** status 200 Successful Response */ UserPoolModel[]
export type GetUserPoolsApiArg = void
export type UserModel = {
  /** Unique name of the user */
  name: string
  uiExposureLevel?: number | null
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
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type LoginResponseModel = {
  /** Text message, which may be displayed to the user */
  detail?: string | null
  error?: string | null
  token?: string | null
  user?: UserModel | null
  /** URL to redirect the user after login */
  redirectUrl?: string | null
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
export type LoginRequestModel = {
  /** Username */
  name: string
  /** Password */
  password: string
}
export type LogoutResponseModel = {
  /** Text description, which may be displayed to the user */
  detail?: string
}
export type LocationInfo = {
  country?: string | null
  subdivision?: string | null
  city?: string | null
}
export type AgentInfo = {
  platform?: string | null
  client?: string | null
  device?: string | null
}
export type ClientInfo = {
  ip: string
  languages?: string[]
  location?: LocationInfo | null
  agent?: AgentInfo | null
  site_id?: string | null
}
export type SessionModel = {
  user: UserModel
  token: string
  created?: number
  lastUsed?: number
  isService?: boolean
  isApiKey?: boolean
  clientInfo?: ClientInfo | null
}
export type CreateSessionRequest = {
  /** User name to create session for */
  userName?: string | null
  /** Message to log in event stream */
  message?: string | null
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
  meta?: {
    [key: string]: any
  } | null
}
