import { RestAPI as api } from '@shared/api'
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
        },
      }),
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
        params: {
          addonName: queryArg.addonName,
          addonVersion: queryArg.addonVersion,
          variant: queryArg.variant,
          identifier: queryArg.identifier,
        },
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
  actionContext: ActionContext
}
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
  actionContext: ActionContext
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
}
export type SimpleFormField = {
  type: 'text' | 'boolean' | 'select' | 'multiselect' | 'hidden' | 'integer' | 'float' | 'label'
  name: string
  label?: string
  placeholder?: any
  value?: string | number | number | boolean | string[]
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
  /** The label of the group the action belongs to */
  groupLabel?: string
  /** Action category */
  category?: string
  /** The order of the action */
  order?: number
  /** An icon for the action */
  icon?: IconModel
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
  /** The type of the entity. If not specified, project-lever or global actions are used. */
  entityType?: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
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
  /** The type of the entity. If not specified, project-lever or global actions are used. */
  entityType?: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
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
  type: 'launcher' | 'server'
  /** Whether the action was successful */
  success?: boolean
  /** The message to display */
  message?: string
  /** The uri to call from the browser */
  uri?: string
  /** The payload of the request */
  payload?: object
}
