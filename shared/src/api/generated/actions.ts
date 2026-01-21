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
          variant: queryArg.variant,
          identifier: queryArg.identifier,
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
          variant: queryArg.variant,
          identifier: queryArg.identifier,
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
  variant?: string
  actionContext: ActionContext
}
export type ListAllActionsApiResponse = /** status 200 Successful Response */ BaseActionManifest[]
export type ListAllActionsApiArg = void
export type ConfigureActionApiResponse = /** status 200 Successful Response */ object
export type ConfigureActionApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  identifier: string
  actionConfig: ActionConfig
}
export type ExecuteActionApiResponse = /** status 200 Successful Response */ ExecuteResponseModel
export type ExecuteActionApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  identifier: string
  'x-sender'?: string
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
  name?: string
  /** The color of the icon (for type material-symbols) */
  color?: string
  /** The URL of the icon (for type url) */
  url?: string
}
export type FormSelectOption = {
  value: string
  label: string
  icon?: string
  color?: string
  badges?: string[]
}
export type SimpleFormField = {
  type: 'text' | 'boolean' | 'select' | 'multiselect' | 'hidden' | 'integer' | 'float' | 'label' | 'file'
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
}
export type BaseActionManifest = {
  /** The identifier of the action */
  identifier: string
  /** Human-friendly name of the action */
  label: string
  /** A short description of the action */
  description?: string
  /** The label of the group the action belongs to */
  groupLabel?: string
  /** Action category */
  category?: string
  /** The order of the action */
  order?: number
  /** An icon for the action */
  icon?: IconModel
  /** If true, the action is only available to admin users */
  adminOnly?: boolean
  /** If true, the action is only available to manager users */
  managerOnly?: boolean
  /** List of fields to be displayed in the action settings */
  configFields?: SimpleFormField[]
  /** Sort icon to the top */
  featured?: boolean
  /** The name of the addon providing the action */
  addonName?: string
  /** The version of the addon providing the action */
  addonVersion?: string
  /** The settings variant of the addon */
  variant?: string
}
export type AvailableActionsListModel = {
  /** The list of available actions */
  actions?: BaseActionManifest[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ActionContext = {
  /** The name of the project. If not provided, use global actions, the rest of the fields are ignored. */
  projectName?: string
  /** The type of the entity. Either a project level entity, 'list' or 'project' for project-wide actions. or None for global actions. */
  entityType?:
    | 'project'
    | 'list'
    | 'folder'
    | 'task'
    | 'product'
    | 'version'
    | 'representation'
    | 'workfile'
  /** List of subtypes present in the entity list */
  entitySubtypes?: string[]
  /** The IDs of the entities */
  entityIds?: string[]
  /** The data from the form */
  formData?: object
}
export type ActionConfig = {
  /** The name of the project. If not provided, use global actions, the rest of the fields are ignored. */
  projectName?: string
  /** The type of the entity. Either a project level entity, 'list' or 'project' for project-wide actions. or None for global actions. */
  entityType?:
    | 'project'
    | 'list'
    | 'folder'
    | 'task'
    | 'product'
    | 'version'
    | 'representation'
    | 'workfile'
  /** List of subtypes present in the entity list */
  entitySubtypes?: string[]
  /** The IDs of the entities */
  entityIds?: string[]
  /** The data from the form */
  formData?: object
  /** The configuration of the action within the given context */
  value?: object
}
export type ExecuteResponseModel = {
  /** The type of response */
  type?: 'form' | 'launcher' | 'navigate' | 'query' | 'redirect' | 'simple'
  /** Payload is still parsed even if the action failed, but the message is highlighted as an error.If the action execution is broken beyond repair, Raise an exception instead of returning a response. */
  success?: boolean
  /** The message to display */
  message?: string
  /** The payload of the response. Payload model is parsed by the client and its schema, is based on the type of action. */
  payload?: object
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
