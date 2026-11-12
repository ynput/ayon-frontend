import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadProjectFile: build.mutation<UploadProjectFileApiResponse, UploadProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files`,
        method: 'POST',
        headers: {
          'X-File-ID': queryArg['X-File-ID'],
          'X-Activity-ID': queryArg['X-Activity-ID'],
          'x-file-name': queryArg['x-file-name'],
          'content-type': queryArg['content-type'],
        },
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
    getProjectFile: build.query<GetProjectFileApiResponse, GetProjectFileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}`,
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
    getProjectFileFilmstrip: build.query<
      GetProjectFileFilmstripApiResponse,
      GetProjectFileFilmstripApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/filmstrip`,
        params: {
          placeholder: queryArg.placeholder,
        },
      }),
    }),
    getProjectFileFilmstripPayload: build.query<
      GetProjectFileFilmstripPayloadApiResponse,
      GetProjectFileFilmstripPayloadApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/files/${queryArg.fileId}/filmstrip/payload`,
        params: {
          v: queryArg.v,
        },
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
  'X-File-ID'?: string | null
  'X-Activity-ID'?: string | null
  'x-file-name': string
  'content-type': string
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
export type GetProjectFileApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileApiArg = {
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
export type GetProjectFileFilmstripApiResponse =
  /** status 200 Successful Response */ FilmstripModel
export type GetProjectFileFilmstripApiArg = {
  projectName: string
  fileId: string
  placeholder?: 'empty' | 'none'
}
export type GetProjectFileFilmstripPayloadApiResponse = /** status 200 Successful Response */ any
export type GetProjectFileFilmstripPayloadApiArg = {
  projectName: string
  fileId: string
  v?: string | null
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
  input?: any
  ctx?: object
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type FileInfo = {
  size: number
  filename?: string
  contentType?: string
  mediaInfo?: {
    [key: string]: any
  } | null
}
export type FilmstripModel = {
  fileId: string
  url: string
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}
