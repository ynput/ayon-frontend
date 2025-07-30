import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listViews: build.query<ListViewsApiResponse, ListViewsApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    createView: build.mutation<CreateViewApiResponse, CreateViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}`,
        method: 'POST',
        body: queryArg.payload,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    getPersonalView: build.query<GetPersonalViewApiResponse, GetPersonalViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/personal`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    getView: build.query<GetViewApiResponse, GetViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/${queryArg.viewId}`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    deleteView: build.mutation<DeleteViewApiResponse, DeleteViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/${queryArg.viewId}`,
        method: 'DELETE',
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListViewsApiResponse = /** status 200 Successful Response */ ViewListModel
export type ListViewsApiArg = {
  viewType: string
  projectName?: string
}
export type CreateViewApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateViewApiArg = {
  viewType: string
  projectName?: string
  payload: OverviewViewPostModel | TaskProgressViewPostModel
}
export type GetPersonalViewApiResponse = /** status 200 Successful Response */
  | OverviewViewModel
  | TaskProgressViewModel
export type GetPersonalViewApiArg = {
  viewType: string
  projectName?: string
}
export type GetViewApiResponse = /** status 200 Successful Response */
  | OverviewViewModel
  | TaskProgressViewModel
export type GetViewApiArg = {
  viewType: string
  viewId: string
  projectName?: string
}
export type DeleteViewApiResponse = /** status 200 Successful Response */ any
export type DeleteViewApiArg = {
  viewType: string
  viewId: string
  projectName?: string
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
  showHierarchy?: boolean
  groupBy?: string
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}
export type OverviewViewPostModel = {
  id?: string
  label: string
  personal?: boolean
  settings: OverviewSettings
}
export type TaskProgressSettings = {
  filter?: QueryFilter
}
export type TaskProgressViewPostModel = {
  id?: string
  label: string
  personal?: boolean
  settings: TaskProgressSettings
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
