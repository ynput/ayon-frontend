import { RestAPI as api } from '../../services/ayon'
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
  /** The name of the icon (for material-symbols) */
  name?: string
  /** The color of the icon (for material-symbols) */
  color?: string
  /** The URL of the icon (for url) */
  url?: string
}
export type BaseActionManifest = {
  /** The identifier of the action */
  identifier: string
  /** Human-friendly name of the action */
  label: string
  /** Action category */
  category?: string
  /** The order of the action */
  order?: number
  /** Path to the action icon */
  icon?: IconModel
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
  /** The name of the project */
  projectName: string
  /** The type of the entity */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  /** List of subtypes present in the entity list */
  entitySubtypes?: string[]
  /** The IDs of the entities */
  entityIds: string[]
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
}
