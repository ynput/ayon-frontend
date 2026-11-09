import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAvailableActionsForContext: build.mutation<
      ListAvailableActionsForContextApiResponse,
      ListAvailableActionsForContextApiArg
    >({
      query: (queryArg) => ({
        url: `/api/actions/list`,
        method: 'POST',
        body: queryArg.actionContext,
        params: {
          mode: queryArg.mode,
          variant: queryArg.variant,
        },
      }),
    }),
    listAllActions: build.query<ListAllActionsApiResponse, ListAllActionsApiArg>({
      query: () => ({ url: `/api/actions/manage` }),
    }),
    configureAction: build.mutation<ConfigureActionApiResponse, ConfigureActionApiArg>({
      query: (queryArg) => ({
        url: `/api/actions/config`,
        method: 'POST',
        body: queryArg.actionConfig,
        params: {
          addonName: queryArg.addonName,
          addonVersion: queryArg.addonVersion,
          identifier: queryArg.identifier,
          variant: queryArg.variant,
        },
      }),
    }),
    executeAction: build.mutation<ExecuteActionApiResponse, ExecuteActionApiArg>({
      query: (queryArg) => ({
        url: `/api/actions/execute`,
        method: 'POST',
        body: queryArg.actionContext,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
        params: {
          addonName: queryArg.addonName,
          addonVersion: queryArg.addonVersion,
          identifier: queryArg.identifier,
          variant: queryArg.variant,
        },
      }),
    }),
    takeAction: build.query<TakeActionApiResponse, TakeActionApiArg>({
      query: (queryArg) => ({ url: `/api/actions/take/${queryArg.token}` }),
    }),
    abortAction: build.mutation<AbortActionApiResponse, AbortActionApiArg>({
      query: (queryArg) => ({
        url: `/api/actions/abort/${queryArg.token}`,
        method: 'POST',
        body: queryArg.abortRequestModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListAvailableActionsForContextApiResponse =
  /** status 200 Successful Response */ AvailableActionsListModel
export type ListAvailableActionsForContextApiArg = {
  mode?: 'simple' | 'dynamic' | 'all'
  variant?: string | null
  actionContext: ActionContext
}
export type ListAllActionsApiResponse = /** status 200 Successful Response */ BaseActionManifest[]
export type ListAllActionsApiArg = void
export type ConfigureActionApiResponse = /** status 200 Successful Response */ {
  [key: string]: any
}
export type ConfigureActionApiArg = {
  addonName: string
  addonVersion: string
  identifier: string
  variant?: string
  actionConfig: ActionConfig
}
export type ExecuteActionApiResponse = /** status 200 Successful Response */ ExecuteResponseModel
export type ExecuteActionApiArg = {
  addonName: string
  addonVersion: string
  identifier: string
  variant?: string
  'x-sender'?: string | null
  'x-sender-type'?: string
  actionContext: ActionContext
}
export type TakeActionApiResponse = /** status 200 Successful Response */ TakeResponseModel
export type TakeActionApiArg = {
  token: string
}
export type AbortActionApiResponse = /** status 200 Successful Response */ any
export type AbortActionApiArg = {
  token: string
  abortRequestModel: AbortRequestModel
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
export type BaseActionManifest = {
  /** The identifier of the action */
  identifier: string
  /** Human-friendly name of the action */
  label: string
  /** A short description of the action */
  description?: string | null
  /** The label of the group the action belongs to */
  groupLabel?: string | null
  /** Action category */
  category?: string
  /** The order of the action */
  order?: number
  /** An icon for the action */
  icon?: IconModel | null
  /** If true, the action is only available to admin users */
  adminOnly?: boolean
  /** If true, the action is only available to manager users */
  managerOnly?: boolean
  /** List of fields to be displayed in the action settings */
  configFields?: SimpleFormField[] | null
  /** Sort icon to the top */
  featured?: boolean
  /** The name of the addon providing the action */
  addonName?: string | null
  /** The version of the addon providing the action */
  addonVersion?: string | null
  /** The settings variant of the addon */
  variant?: string | null
}
export type AvailableActionsListModel = {
  /** The list of available actions */
  actions?: BaseActionManifest[]
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
export type ActionContext = {
  /** The name of the project. If not provided, use global actions, the rest of the fields are ignored. */
  projectName?: string | null
  /** The type of the entity. Either a project level entity, 'list' or 'project' for project-wide actions. or None for global actions. */
  entityType?:
    | (
        | 'project'
        | 'list'
        | 'folder'
        | 'task'
        | 'product'
        | 'version'
        | 'representation'
        | 'workfile'
      )
    | null
  /** List of subtypes present in the entity list */
  entitySubtypes?: string[] | null
  /** The IDs of the entities */
  entityIds?: string[] | null
  /** The data from the form */
  formData?: {
    [key: string]: any
  } | null
}
export type ActionConfig = {
  /** The name of the project. If not provided, use global actions, the rest of the fields are ignored. */
  projectName?: string | null
  /** The type of the entity. Either a project level entity, 'list' or 'project' for project-wide actions. or None for global actions. */
  entityType?:
    | (
        | 'project'
        | 'list'
        | 'folder'
        | 'task'
        | 'product'
        | 'version'
        | 'representation'
        | 'workfile'
      )
    | null
  /** List of subtypes present in the entity list */
  entitySubtypes?: string[] | null
  /** The IDs of the entities */
  entityIds?: string[] | null
  /** The data from the form */
  formData?: {
    [key: string]: any
  } | null
  /** The configuration of the action within the given context */
  value?: {
    [key: string]: any
  } | null
}
export type ExecuteResponseModel = {
  /** The type of response */
  type?: 'form' | 'launcher' | 'navigate' | 'query' | 'redirect' | 'simple'
  /** Payload is still parsed even if the action failed, but the message is highlighted as an error.If the action execution is broken beyond repair, Raise an exception instead of returning a response. */
  success?: boolean
  /** The message to display */
  message?: string | null
  /** The payload of the response. Payload model is parsed by the client and its schema, is based on the type of action. */
  payload?: {
    [key: string]: any
  } | null
}
export type TakeResponseModel = {
  eventId: string
  actionIdentifier: string
  args?: string[]
  context: ActionContext
  addonName: string
  addonVersion: string
  variant: string
  /** The user who initiated the action */
  userName: string
}
export type AbortRequestModel = {
  message?: string
}
