import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createFirstAdmin: build.mutation<CreateFirstAdminApiResponse, CreateFirstAdminApiArg>({
      query: (queryArg) => ({
        url: `/api/onboarding/initialize`,
        method: 'POST',
        body: queryArg.initializeRequestModel,
      }),
    }),
    abortOnboarding: build.mutation<AbortOnboardingApiResponse, AbortOnboardingApiArg>({
      query: () => ({ url: `/api/onboarding/abort`, method: 'POST' }),
    }),
    restartOnboarding: build.mutation<RestartOnboardingApiResponse, RestartOnboardingApiArg>({
      query: () => ({ url: `/api/onboarding/restart`, method: 'POST' }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type CreateFirstAdminApiResponse = /** status 200 Successful Response */ LoginResponseModel
export type CreateFirstAdminApiArg = {
  initializeRequestModel: InitializeRequestModel
}
export type AbortOnboardingApiResponse = /** status 200 Successful Response */ any
export type AbortOnboardingApiArg = void
export type RestartOnboardingApiResponse = /** status 200 Successful Response */ any
export type RestartOnboardingApiArg = void
export type UserAttribModel = {
  fullName?: string
  email?: string
  avatarUrl?: string
  developerMode?: boolean
}
export type UserModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  uiExposureLevel?: number
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
  /** Text message, which may be displayed to the user */
  detail?: string
  error?: string
  token?: string
  user?: UserModel
  /** URL to redirect the user after login */
  redirectUrl?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type InitializeRequestModel = {
  /** Username */
  adminName: string
  /** Password */
  adminPassword: string
  /** Full name */
  adminFullName?: string
  adminEmail?: string
}
