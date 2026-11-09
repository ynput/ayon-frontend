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
  name?: string | null
  /** The color of the icon (for type material-symbols) */
  color?: string | null
  /** The URL of the icon (for type url) */
  url?: string | null
}
export type EnumItem = {
  value: string | number | number | boolean
  label: string
  description?: string | null
  fulltext?: string[] | null
  group?: string | null
  /** Icon name (material symbol) or IconModel object */
  icon?: string | IconModel | null
  color?: string | null
  shortName?: string | null
  /** Enum item is visible, but not selectable */
  disabled?: boolean
  /** Message to show when the option is disabled */
  disabledMessage?: string | null
  /** Enum item is not visible in the dropdown */
  hidden?: boolean
  /** Extra badge labels to display next to the item */
  badges?: string[] | null
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
export type FormFileData = {
  filename: string
  payload: string
  download?: boolean
}
export type FormOptionItem = {
  value: string | number | number | boolean
  label?: string
  description?: string
  group?: string
  icon?: string | IconModel
  color?: string
  shortName?: string
  disabled?: boolean
  disabledMessage?: string
  hidden?: boolean
  badges?: string[]
}
export type QueryCondition = {
  /** Path to the key separated by slashes */
  key: string
  /** Value to compare against */
  value?: string | number | number | boolean | string[] | number[] | number[] | null
  /** Comparison operator. like and notlike perform case-insensitive substring matching. One surrounding pair of % is treated as a substring wrapper; %, _ and backslashes within it are literal. */
  operator?:
    | 'eq'
    | 'like'
    | 'notlike'
    | 're'
    | 'lt'
    | 'gt'
    | 'lte'
    | 'gte'
    | 'ne'
    | 'isnull'
    | 'notnull'
    | 'in'
    | 'notin'
    | 'includes'
    | 'excludes'
    | 'includesall'
    | 'excludesall'
    | 'includesany'
    | 'excludesany'
}
export type QueryFilter = {
  /** List of conditions to be evaluated */
  conditions?: (QueryCondition | QueryFilter)[]
  /** Operator to use when joining conditions */
  operator?: 'and' | 'or'
}
export type FormFieldPatch = {
  value?: string | number | number | boolean | string[] | number[] | number[] | FormFileData | null
  label?: string
  placeholder?: any
  options?: FormOptionItem[]
  enum_resolver?: string
  enum_resolver_params?: {
    [key: string]: any
  }
  read_only?: boolean
  hidden?: boolean
  disabled?: boolean
  highlight?: 'info' | 'warning' | 'error'
}
export type FormFieldRule = {
  /** Filter source events */
  when: QueryFilter
  set: FormFieldPatch
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
  value?: string | number | number | boolean | string[] | number[] | number[] | FormFileData
  regex?: string
  multiline?: boolean
  syntax?: string
  options?: FormOptionItem[]
  highlight?: 'info' | 'warning' | 'error'
  min?: number | number
  max?: number | number
  valid_extensions?: string[]
  read_only?: boolean
  disabled?: boolean
  hidden?: boolean
  enum_resolver?: string
  enum_resolver_params?: {
    [key: string]: any
  }
  rules?: FormFieldRule[]
}
export type EnumResolverInfo = {
  name: string
  /** Optional human-readable label for the resolver */
  label: string
  /** Optional human-readable description for the resolver */
  description?: string | null
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
  settingsForm?: SimpleFormField[] | null
}
