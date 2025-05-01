import { BaseAPI as api } from '@shared/api'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    setProjectsAccess: build.mutation<SetProjectsAccessApiResponse, SetProjectsAccessApiArg>({
      query: (queryArg) => ({ url: `/api/access`, method: 'POST', body: queryArg.payload }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type SetProjectsAccessApiResponse = /** status 200 Successful Response */ any
export type SetProjectsAccessApiArg = {
  payload: {
    [key: string]: {
      [key: string]: string[]
    }
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
