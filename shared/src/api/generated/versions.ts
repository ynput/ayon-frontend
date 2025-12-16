import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
    getVersion: build.query<GetVersionApiResponse, GetVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
      }),
    }),
    deleteVersion: build.mutation<DeleteVersionApiResponse, DeleteVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateVersion: build.mutation<UpdateVersionApiResponse, UpdateVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
        method: 'PATCH',
        body: queryArg.versionPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    createVersion: build.mutation<CreateVersionApiResponse, CreateVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions`,
        method: 'POST',
        body: queryArg.versionPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
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
export type GetVersionApiResponse = /** status 200 Successful Response */ VersionModel
export type GetVersionApiArg = {
  projectName: string
  versionId: string
}
export type DeleteVersionApiResponse = unknown
export type DeleteVersionApiArg = {
  projectName: string
  versionId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateVersionApiResponse = unknown
export type UpdateVersionApiArg = {
  projectName: string
  versionId: string
  'x-sender'?: string
  'x-sender-type'?: string
  versionPatchModel: VersionPatchModel
}
export type CreateVersionApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateVersionApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  versionPostModel: VersionPostModel
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type CreateThumbnailResponseModel = {
  id: string
}
export type VersionAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  intent?: string
  machine?: string
  source?: string
  comment?: string
  site?: string
  families?: string[]
  colorSpace?: string
  /** Textual description of the entity */
  description?: string
}
export type VersionModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** Version number */
  version: number
  /** ID of the parent product */
  productId: string
  taskId?: string
  thumbnailId?: string
  author?: string
  path?: string
  attrib?: VersionAttribModel
  data?: Record<string, any>
  /** Whether the version is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the version */
  status?: string
  /** Tags assigned to the the version */
  tags?: string[]
  /** Who created the version */
  createdBy?: string
  /** Who last updated the version */
  updatedBy?: string
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type VersionPatchModel = {
  /** Version number */
  version?: number
  /** ID of the parent product */
  productId?: string
  taskId?: string
  thumbnailId?: string
  author?: string
  /** Status of the version */
  status?: string
  /** Tags assigned to the the version */
  tags?: string[]
  /** Who created the version */
  createdBy?: string
  /** Who last updated the version */
  updatedBy?: string
  attrib?: VersionAttribModel
  data?: Record<string, any>
  /** Whether the version is active */
  active?: boolean
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type VersionPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** Version number */
  version: number
  /** ID of the parent product */
  productId: string
  taskId?: string
  thumbnailId?: string
  author?: string
  /** Status of the version */
  status?: string
  /** Tags assigned to the the version */
  tags?: string[]
  /** Who created the version */
  createdBy?: string
  /** Who last updated the version */
  updatedBy?: string
  attrib?: VersionAttribModel
  data?: Record<string, any>
  /** Whether the version is active */
  active?: boolean
}
