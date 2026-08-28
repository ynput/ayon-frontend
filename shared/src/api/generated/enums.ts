import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEnum: build.query<GetEnumApiResponse, GetEnumApiArg>({
      query: (queryArg) => ({ url: `/api/enum/${queryArg.enumName}` }),
    }),
    listEnums: build.query<ListEnumsApiResponse, ListEnumsApiArg>({
      query: () => ({ url: `/api/enum` }),
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
export type ListEnumsApiResponse = /** status 200 Successful Response */ EnumResolverInfo[]
export type ListEnumsApiArg = void
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
  shortName?: string
  disabled?: boolean
  disabledMessage?: string
}
export type FormSelectOption = {
  value: string
  label: string
  icon?: string
  color?: string
  badges?: string[]
}
export type SimpleFormField = {
  type:
    | 'text'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'hidden'
    | 'integer'
    | 'float'
    | 'label'
    | 'file'
  name: string
  label?: string
  placeholder?: any
  value?: string | number | number | boolean | string[] | number[] | number[]
  regex?: string
  multiline?: boolean
  syntax?: string
  options?: FormSelectOption[]
  highlight?: 'info' | 'warning' | 'error'
  min?: number | number
  max?: number | number
  valid_extensions?: string[]
}
export type EnumResolverInfo = {
  /** Resolver name */
  name: string
  /** Dictionary of accepted query parameters and their type names */
  acceptedParams: {
    [key: string]:
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
  }
  /** Optional form fields for resolver settings */
  settingsForm?: SimpleFormField[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
