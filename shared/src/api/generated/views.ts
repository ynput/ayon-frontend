import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    initViews: build.mutation<InitViewsApiResponse, InitViewsApiArg>({
      query: () => ({ url: `/api/views/__init__`, method: 'POST' }),
    }),
    getViewList: build.query<GetViewListApiResponse, GetViewListApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}`,
        params: {
          project: queryArg.project,
        },
      }),
    }),
    createView: build.mutation<CreateViewApiResponse, CreateViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}`,
        method: 'POST',
        body: queryArg.payload,
        params: {
          project: queryArg.project,
        },
      }),
    }),
    getView: build.query<GetViewApiResponse, GetViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/${queryArg.viewId}`,
        params: {
          project: queryArg.project,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type InitViewsApiResponse = /** status 200 Successful Response */ any
export type InitViewsApiArg = void
export type GetViewListApiResponse = /** status 200 Successful Response */ ViewListModel
export type GetViewListApiArg = {
  viewType: string
  project?: string
}
export type CreateViewApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateViewApiArg = {
  viewType: string
  project?: string
  payload: OverviewViewModel | TaskProgressViewModel
}
export type GetViewApiResponse = /** status 200 Successful Response */
  | OverviewViewModel
  | TaskProgressViewModel
export type GetViewApiArg = {
  viewType: string
  viewId: string
  project?: string
}
export type ViewListItemModel = {
  id?: string
  label: string
  scope?: 'project' | 'studio'
  position?: number
  owner?: string
  visibility?: 'public' | 'private'
  personal?: boolean
}
export type ViewListModel = {
  views: ViewListItemModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type QueryCondition = {
  /** Path to the key separated by slashes */
  key: string
  /** Value to compare against */
  value?: string | number | number | boolean | string[] | number[] | number[]
  /** Comparison operator */
  operator?:
    | 'eq'
    | 'like'
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
export type ColumnItemModel = {
  name: string
  pinned?: boolean
  width?: number
}
export type OverviewSettings = {
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}
export type OverviewViewModel = {
  id?: string
  label: string
  scope?: 'project' | 'studio'
  position?: number
  owner?: string
  visibility?: 'public' | 'private'
  personal?: boolean
  settings: OverviewSettings
  viewType?: 'overview'
}
export type TaskProgressSettings = {
  expanded?: boolean
  filter?: QueryFilter
}
export type TaskProgressViewModel = {
  id?: string
  label: string
  scope?: 'project' | 'studio'
  position?: number
  owner?: string
  visibility?: 'public' | 'private'
  personal?: boolean
  settings: TaskProgressSettings
  viewType?: 'taskProgress'
}
