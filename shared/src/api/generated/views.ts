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
        body: queryArg.genericViewPostModel,
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
    getBaseView: build.query<GetBaseViewApiResponse, GetBaseViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/base`,
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
    updateView: build.mutation<UpdateViewApiResponse, UpdateViewApiArg>({
      query: (queryArg) => ({
        url: `/api/views/${queryArg.viewType}/${queryArg.viewId}`,
        method: 'PATCH',
        body: queryArg.genericViewPatchModel,
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
  projectName?: string | null
}
export type CreateViewApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateViewApiArg = {
  viewType: string
  projectName?: string | null
  genericViewPostModel: GenericViewPostModel
}
export type GetWorkingViewApiResponse = /** status 200 Successful Response */ GenericViewModel
export type GetWorkingViewApiArg = {
  viewType: string
  projectName?: string | null
}
export type GetBaseViewApiResponse = /** status 200 Successful Response */ GenericViewModel
export type GetBaseViewApiArg = {
  viewType: string
  projectName?: string | null
}
export type GetDefaultViewApiResponse = /** status 200 Successful Response */ GenericViewModel
export type GetDefaultViewApiArg = {
  viewType: string
  projectName?: string | null
}
export type SetDefaultViewApiResponse = /** status 200 Successful Response */ any
export type SetDefaultViewApiArg = {
  viewType: string
  projectName?: string | null
  setDefaultViewRequestModel: SetDefaultViewRequestModel
}
export type GetViewApiResponse = /** status 200 Successful Response */ GenericViewModel
export type GetViewApiArg = {
  viewType: string
  viewId: string
  projectName?: string | null
}
export type UpdateViewApiResponse = /** status 200 Successful Response */ any
export type UpdateViewApiArg = {
  viewType: string
  viewId: string
  projectName?: string | null
  genericViewPatchModel: GenericViewPatchModel
}
export type DeleteViewApiResponse = /** status 200 Successful Response */ any
export type DeleteViewApiArg = {
  viewType: string
  viewId: string
  projectName?: string | null
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
  /** False when the view is not shared with the user, who sees it only because they are a manager or admin */
  sharedWithMe?: boolean
}
export type ViewListModel = {
  views: ViewListItemModel[]
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
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type GenericViewPostModel = {
  /** Unique identifier for the view within the given scope. */
  id?: string
  /** Human-readable name of the view. */
  label: string
  /** Working view is a special type of the view that automatically stores the current view settings without explicitly saving them. Working views are always private and scoped to the project  */
  working?: boolean
  viewType?: string | null
  settings: {
    [key: string]: any
  }
}
export type GenericViewModel = {
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
  viewType: string
  settings: {
    [key: string]: any
  }
  access: {
    [key: string]: any
  }
}
export type SetDefaultViewRequestModel = {
  viewId: string
}
export type GenericViewPatchModel = {
  label?: string | null
  owner?: string | null
  viewType?: string | null
  settings?: {
    [key: string]: any
  } | null
}
