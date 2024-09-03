import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUser: build.query<GetUserApiResponse, GetUserApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}` }),
    }),
    getUserSessions: build.query<GetUserSessionsApiResponse, GetUserSessionsApiArg>({
      query: (queryArg) => ({ url: `/api/users/${queryArg.userName}/sessions` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
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
  data?: object
  /** Whether the user is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
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
