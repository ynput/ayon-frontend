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
export type DeleteAttributeApiResponse = unknown
export type DeleteAttributeApiArg = {
  attributeName: string
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
  /** List of enum items used for displaying select widgets */
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
export type GetAttributeListModel = {
  attributes?: AttributeModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
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
  )[]
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
  data: AttributeData
}
