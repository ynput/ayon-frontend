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
    getWorkingView: build.query<GetWorkingViewApiResponse, GetWorkingViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/working`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    getDefaultView: build.query<GetDefaultViewApiResponse, GetDefaultViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/default`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    setDefaultView: build.mutation<SetDefaultViewApiResponse, SetDefaultViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/default`,
        method: 'POST',
        body: queryArg.setDefaultViewRequestModel,
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
    updateView: build.mutation<UpdateViewApiResponse, UpdateViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/${queryArg.viewId}`,
        method: 'PATCH',
        body: queryArg.payload,
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
  payload:
    | OverviewViewPostModel
    | TaskProgressViewPostModel
    | ListsViewPostModel
    | ReviewsViewPostModel
}
export type GetWorkingViewApiResponse =
  /** status 200 Successful Response */
  OverviewViewModel | TaskProgressViewModel | ListsViewModel | ReviewsViewModel
export type GetWorkingViewApiArg = {
  viewType: string
  projectName?: string
}
export type GetDefaultViewApiResponse =
  /** status 200 Successful Response */
  OverviewViewModel | TaskProgressViewModel | ListsViewModel | ReviewsViewModel
export type GetDefaultViewApiArg = {
  viewType: string
  projectName?: string
}
export type SetDefaultViewApiResponse = /** status 200 Successful Response */ any
export type SetDefaultViewApiArg = {
  viewType: string
  projectName?: string
  setDefaultViewRequestModel: SetDefaultViewRequestModel
}
export type GetViewApiResponse =
  /** status 200 Successful Response */
  OverviewViewModel | TaskProgressViewModel | ListsViewModel | ReviewsViewModel
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
export type UpdateViewApiResponse = /** status 200 Successful Response */ any
export type UpdateViewApiArg = {
  viewType: string
  viewId: string
  projectName?: string
  payload:
    | OverviewViewPatchModel
    | TaskProgressViewPatchModel
    | ListsViewPatchModel
    | ReviewsViewPatchModel
}
export type ViewListItemModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Determines whether the view is only available for the given project or for all projects (studio). */
  scope: 'project' | 'studio'
  /** Name of the user who created the view. Owners have full control over the view,  */
  owner: string
  /** Visibility of the view. Public views are visible to all users, private views are only visible to the owner. */
  visibility: 'public' | 'private'
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working: boolean
  position: number
  accessLevel: number
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
  visible?: boolean
  pinned?: boolean
  width?: number
}
export type OverviewSettings = {
  showHierarchy?: boolean
  rowHeight?: number
  groupBy?: string
  showEmptyGroups?: boolean
  sortBy?: string
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}
export type OverviewViewPostModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working?: boolean
  settings: OverviewSettings
}
export type TaskProgressSettings = {
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}
export type TaskProgressViewPostModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working?: boolean
  settings: TaskProgressSettings
}
export type ListsSettings = {
  rowHeight?: number
  sortBy?: string
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}
export type ListsViewPostModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working?: boolean
  settings: ListsSettings
}
export type OverviewViewModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Determines whether the view is only available for the given project or for all projects (studio). */
  scope: 'project' | 'studio'
  /** Name of the user who created the view. Owners have full control over the view,  */
  owner: string
  /** Visibility of the view. Public views are visible to all users, private views are only visible to the owner. */
  visibility: 'public' | 'private'
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working: boolean
  position: number
  accessLevel: number
  settings: OverviewSettings
  access: object
  viewType?: 'overview'
}
export type TaskProgressViewModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Determines whether the view is only available for the given project or for all projects (studio). */
  scope: 'project' | 'studio'
  /** Name of the user who created the view. Owners have full control over the view,  */
  owner: string
  /** Visibility of the view. Public views are visible to all users, private views are only visible to the owner. */
  visibility: 'public' | 'private'
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working: boolean
  position: number
  accessLevel: number
  settings: TaskProgressSettings
  access: object
  viewType?: 'taskProgress'
}
export type ListsViewModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Determines whether the view is only available for the given project or for all projects (studio). */
  scope: 'project' | 'studio'
  /** Name of the user who created the view. Owners have full control over the view,  */
  owner: string
  /** Visibility of the view. Public views are visible to all users, private views are only visible to the owner. */
  visibility: 'public' | 'private'
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working: boolean
  position: number
  accessLevel: number
  settings: ListsSettings
  access: object
  viewType?: 'lists'
}
export type ReviewsViewModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Determines whether the view is only available for the given project or for all projects (studio). */
  scope: 'project' | 'studio'
  /** Name of the user who created the view. Owners have full control over the view,  */
  owner: string
  /** Visibility of the view. Public views are visible to all users, private views are only visible to the owner. */
  visibility: 'public' | 'private'
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working: boolean
  position: number
  accessLevel: number
  settings: ReviewsSettings
  access: object
  viewType?: 'reviews'
}
export type SetDefaultViewRequestModel = {
  viewId: string
}
export type OverviewViewPatchModel = {
  label?: string
  owner?: string
  settings?: OverviewSettings
}
export type TaskProgressViewPatchModel = {
  label?: string
  owner?: string
  settings?: TaskProgressSettings
}
export type ListsViewPatchModel = {
  label?: string
  owner?: string
  settings?: ListsSettings
}
export type ReviewsViewPatchModel = {
  label?: string
  owner?: string
  settings?: ReviewsSettings
}
