import { RestAPI as api } from '../../services/ayon'
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
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
  studioId?: string
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
export type SessionModel = {
  user: UserModel
  token: string
  created?: number
  lastUsed?: number
  isService?: boolean
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
