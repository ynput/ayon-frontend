import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createThumbnail: build.mutation<CreateThumbnailApiResponse, CreateThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnails`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getThumbnail: build.query<GetThumbnailApiResponse, GetThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnails/${queryArg.thumbnailId}`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    updateThumbnail: build.mutation<UpdateThumbnailApiResponse, UpdateThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/thumbnails/${queryArg.thumbnailId}`,
        method: 'PUT',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getFolderThumbnail: build.query<GetFolderThumbnailApiResponse, GetFolderThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    createFolderThumbnail: build.mutation<
      CreateFolderThumbnailApiResponse,
      CreateFolderThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getVersionThumbnail: build.query<GetVersionThumbnailApiResponse, GetVersionThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    createVersionThumbnail: build.mutation<
      CreateVersionThumbnailApiResponse,
      CreateVersionThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/thumbnail`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getWorkfileThumbnail: build.query<GetWorkfileThumbnailApiResponse, GetWorkfileThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    createWorkfileThumbnail: build.mutation<
      CreateWorkfileThumbnailApiResponse,
      CreateWorkfileThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}/thumbnail`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getTaskThumbnail: build.query<GetTaskThumbnailApiResponse, GetTaskThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    createTaskThumbnail: build.mutation<CreateTaskThumbnailApiResponse, CreateTaskThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/thumbnail`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type CreateThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateThumbnailApiArg = {
  projectName: string
  'content-type'?: string
}
export type GetThumbnailApiResponse = unknown
export type GetThumbnailApiArg = {
  projectName: string
  thumbnailId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type UpdateThumbnailApiResponse = unknown
export type UpdateThumbnailApiArg = {
  projectName: string
  thumbnailId: string
  'content-type'?: string
}
export type GetFolderThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type CreateFolderThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  'content-type'?: string
}
export type GetVersionThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetVersionThumbnailApiArg = {
  projectName: string
  versionId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type CreateVersionThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateVersionThumbnailApiArg = {
  projectName: string
  versionId: string
  'content-type'?: string
}
export type GetWorkfileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type CreateWorkfileThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  'content-type'?: string
}
export type GetTaskThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetTaskThumbnailApiArg = {
  projectName: string
  taskId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type CreateTaskThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateTaskThumbnailApiArg = {
  projectName: string
  taskId: string
  'content-type'?: string
}
export type CreateThumbnailResponseModel = {
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
