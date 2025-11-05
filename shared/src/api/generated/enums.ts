import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEnum: build.query<GetEnumApiResponse, GetEnumApiArg>({
      query: (queryArg) => ({ url: `/api/enum/${queryArg.enumName}` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetEnumApiResponse = /** status 200 Successful Response */ EnumItem[]
export type GetEnumApiArg = {
  /** Name of the enum */
  enumName: string
}
export type IconModel = {
  type?: 'material-symbols' | 'url'
  /** The name of the icon (for type material-symbols) */
  name?: string
  /** The color of the icon (for type material-symbols) */
  color?: string
  /** The URL of the icon (for type url) */
  url?: string
}
export type EnumItem = {
  value: string | number | number | boolean
  label: string
  description?: string
  fulltext?: string[]
  group?: string
  /** Icon name (material symbol) or IconModel object */
  icon?: string | IconModel
  color?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
