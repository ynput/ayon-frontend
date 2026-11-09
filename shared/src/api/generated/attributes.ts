import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAttributeList: build.query<GetAttributeListApiResponse, GetAttributeListApiArg>({
      query: () => ({ url: `/api/attributes` }),
    }),
    setAttributeList: build.mutation<SetAttributeListApiResponse, SetAttributeListApiArg>({
      query: (queryArg) => ({
        url: `/api/attributes`,
        method: 'PUT',
        body: queryArg.setAttributeListModel,
      }),
    }),
    getAttributeConfig: build.query<GetAttributeConfigApiResponse, GetAttributeConfigApiArg>({
      query: (queryArg) => ({ url: `/api/attributes/${queryArg.attributeName}` }),
    }),
    setAttributeConfig: build.mutation<SetAttributeConfigApiResponse, SetAttributeConfigApiArg>({
      query: (queryArg) => ({
        url: `/api/attributes/${queryArg.attributeName}`,
        method: 'PUT',
        body: queryArg.attributePutModel,
      }),
    }),
    patchAttributeConfig: build.mutation<
      PatchAttributeConfigApiResponse,
      PatchAttributeConfigApiArg
    >({
      query: (queryArg) => ({
        url: `/api/attributes/${queryArg.attributeName}`,
        method: 'PATCH',
        body: queryArg.attributePatchModel,
      }),
    }),
    deleteAttribute: build.mutation<DeleteAttributeApiResponse, DeleteAttributeApiArg>({
      query: (queryArg) => ({ url: `/api/attributes/${queryArg.attributeName}`, method: 'DELETE' }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetAttributeListApiResponse =
  /** status 200 Successful Response */ GetAttributeListModel
export type GetAttributeListApiArg = void
export type SetAttributeListApiResponse = unknown
export type SetAttributeListApiArg = {
  setAttributeListModel: SetAttributeListModel
}
export type GetAttributeConfigApiResponse = /** status 200 Successful Response */ AttributeModel
export type GetAttributeConfigApiArg = {
  attributeName: string
}
export type SetAttributeConfigApiResponse = unknown
export type SetAttributeConfigApiArg = {
  attributeName: string
  attributePutModel: AttributePutModel
}
export type PatchAttributeConfigApiResponse = unknown
export type PatchAttributeConfigApiArg = {
  attributeName: string
  attributePatchModel: AttributePatchModel
}
export type DeleteAttributeApiResponse = unknown
export type DeleteAttributeApiArg = {
  attributeName: string
}
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
export type AttributeData = {
  /** Type of attribute value */
  type?:
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
  title?: string | null
  description?: string | null
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number | null
  ge?: number | number | null
  lt?: number | number | null
  le?: number | number | null
  minLength?: number | null
  maxLength?: number | null
  /** Minimum number of items in list type. */
  minItems?: number | null
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number | null
  /** Only for string types. The value must match this regex. */
  regex?: string | null
  /** List of enum items used for displaying select widgets */
  enum?: EnumItem[] | null
  /** Name of the function that provides enum values dynamically. */
  enumResolver?: string | null
  /** Settings passed to the enum resolver function. */
  enumResolverSettings?: {
    [key: string]: any
  } | null
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
  /** Specific widget style this field should use. */
  widget?: string | null
  /** Any additional config specific for the widget style.(Date formats, precision etc.) */
  widgetSettings?: {
    [key: string]: any
  } | null
}
export type AttributeModel = {
  name: string
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
    | 'list'
  )[]
  data: AttributeData
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
}
export type GetAttributeListModel = {
  attributes?: AttributeModel[]
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
export type SetAttributeListModel = {
  attributes?: AttributeModel[]
  /** Delete custom attributes not includedin the payload from the database. */
  deleteMissing?: boolean
}
export type AttributePutModel = {
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
    | 'list'
  )[]
  data: AttributeData
}
export type AttributePatchModel = {
  /** Default order */
  position?: number | null
  /** List of entity types the attribute is available on */
  scope?:
    | (
        | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
        | ('project' | 'user')
        | 'list'
      )[]
    | null
  data?: AttributeData | null
}
