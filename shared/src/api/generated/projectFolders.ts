import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProjectFolders: build.query<GetProjectFoldersApiResponse, GetProjectFoldersApiArg>({
      query: () => ({ url: `/api/projectFolders` }),
    }),
    createProjectFolder: build.mutation<CreateProjectFolderApiResponse, CreateProjectFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projectFolders`,
        method: 'POST',
        body: queryArg.projectFolderPostModel,
      }),
    }),
    deleteProjectFolder: build.mutation<DeleteProjectFolderApiResponse, DeleteProjectFolderApiArg>({
      query: (queryArg) => ({ url: `/api/projectFolders/${queryArg.folderId}`, method: 'DELETE' }),
    }),
    updateProjectFolder: build.mutation<UpdateProjectFolderApiResponse, UpdateProjectFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projectFolders/${queryArg.folderId}`,
        method: 'PATCH',
        body: queryArg.projectFolderPatchModel,
      }),
    }),
    setProjectFoldersOrder: build.mutation<
      SetProjectFoldersOrderApiResponse,
      SetProjectFoldersOrderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projectFolders/order`,
        method: 'POST',
        body: queryArg.projectFolderOrderModel,
      }),
    }),
    assignProjectsToFolder: build.mutation<
      AssignProjectsToFolderApiResponse,
      AssignProjectsToFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projectFolders/assign`,
        method: 'POST',
        body: queryArg.assignProjectRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetProjectFoldersApiResponse =
  /** status 200 Successful Response */ ProjectFoldersResponseModel
export type GetProjectFoldersApiArg = void
export type CreateProjectFolderApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateProjectFolderApiArg = {
  projectFolderPostModel: ProjectFolderPostModel
}
export type DeleteProjectFolderApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectFolderApiArg = {
  folderId: string
}
export type UpdateProjectFolderApiResponse = /** status 200 Successful Response */ any
export type UpdateProjectFolderApiArg = {
  folderId: string
  projectFolderPatchModel: ProjectFolderPatchModel
}
export type SetProjectFoldersOrderApiResponse = /** status 200 Successful Response */ any
export type SetProjectFoldersOrderApiArg = {
  projectFolderOrderModel: ProjectFolderOrderModel
}
export type AssignProjectsToFolderApiResponse = /** status 200 Successful Response */ any
export type AssignProjectsToFolderApiArg = {
  assignProjectRequest: AssignProjectRequest
}
export type ProjectFolderData = {
  /** Hex color code */
  color?: string
  /** Icon name */
  icon?: string
}
export type ProjectFolderModel = {
  id: string
  label: string
  parentId?: string
  position?: number
  data?: ProjectFolderData
}
export type ProjectFoldersResponseModel = {
  folders?: ProjectFolderModel[]
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ProjectFolderPostModel = {
  id?: string
  label: string
  parentId?: string
  data?: ProjectFolderData
}
export type ProjectFolderPatchModel = {
  label?: string
  parentId?: string
  data?: ProjectFolderData
}
export type ProjectFolderOrderModel = {
  order: string[]
}
export type AssignProjectRequest = {
  folderId?: string | null
  projectNames: string[]
}
