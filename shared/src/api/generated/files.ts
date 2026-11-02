import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadProjectFile: build.mutation<UploadProjectFileApiResponse, UploadProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files`,
        method: 'POST',
        headers: {
          'x-file-id': queryArg['x-file-id'],
          'x-file-name': queryArg['x-file-name'],
          'x-activity-id': queryArg['x-activity-id'],
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getProjectFile: build.query<GetProjectFileApiResponse, GetProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
      }),
    }),
    deleteProjectFile: build.mutation<DeleteProjectFileApiResponse, DeleteProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'DELETE',
      }),
    }),
    getProjectFileHead: build.mutation<GetProjectFileHeadApiResponse, GetProjectFileHeadApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
        method: 'HEAD',
      }),
    }),
    getProjectFileInfo: build.query<GetProjectFileInfoApiResponse, GetProjectFileInfoApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/info`,
      }),
    }),
    getProjectFilePayload: build.query<
      GetProjectFilePayloadApiResponse,
      GetProjectFilePayloadApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/payload`,
      }),
    }),
    getProjectFileThumbnail: build.query<
      GetProjectFileThumbnailApiResponse,
      GetProjectFileThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/thumbnail`,
      }),
    }),
    getProjectFileStill: build.query<GetProjectFileStillApiResponse, GetProjectFileStillApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/still`,
        params: {
          t: queryArg.t,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type UploadProjectFileApiResponse =
  /** status 201 Successful Response */ CreateFileResponseModel
export type UploadProjectFileApiArg = {
  projectName: string
  'x-file-id'?: string
  'x-file-name': string
  'x-activity-id'?: string
  'content-type': string
}
export type GetProjectFileApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileApiArg = {
  projectName: string
  fileId: string
}
export type DeleteProjectFileApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectFileApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileHeadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileHeadApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileInfoApiResponse = /** status 200 Successful Response */ FileInfo
export type GetProjectFileInfoApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFilePayloadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFilePayloadApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileThumbnailApiArg = {
  projectName: string
  fileId: string
}
export type GetProjectFileStillApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileStillApiArg = {
  projectName: string
  fileId: string
  t?: number
}
export type CreateFileResponseModel = {
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
export type FileInfo = {
  size: number
  filename?: string
  contentType?: string
}
