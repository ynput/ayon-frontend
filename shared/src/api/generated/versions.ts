import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
    getVersionThumbnail: build.query<GetVersionThumbnailApiResponse, GetVersionThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    getVersionFilmstrip: build.query<GetVersionFilmstripApiResponse, GetVersionFilmstripApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/filmstrip`,
        params: {
          placeholder: queryArg.placeholder,
        },
      }),
    }),
    getVersion: build.query<GetVersionApiResponse, GetVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
      }),
    }),
    updateVersion: build.mutation<UpdateVersionApiResponse, UpdateVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
        method: 'PATCH',
        body: queryArg.versionPatchModel,
      }),
    }),
    deleteVersion: build.mutation<DeleteVersionApiResponse, DeleteVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}`,
        method: 'DELETE',
      }),
    }),
    createVersion: build.mutation<CreateVersionApiResponse, CreateVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions`,
        method: 'POST',
        body: queryArg.versionPostModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type CreateVersionThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateVersionThumbnailApiArg = {
  projectName: string
  versionId: string
  'content-type'?: string | null
}
export type GetVersionThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetVersionThumbnailApiArg = {
  projectName: string
  versionId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type GetVersionFilmstripApiResponse = /** status 200 Successful Response */ FilmstripModel
export type GetVersionFilmstripApiArg = {
  projectName: string
  versionId: string
  placeholder?: 'empty' | 'none'
}
export type GetVersionApiResponse = /** status 200 Successful Response */ VersionModel
export type GetVersionApiArg = {
  projectName: string
  versionId: string
}
export type UpdateVersionApiResponse = unknown
export type UpdateVersionApiArg = {
  projectName: string
  versionId: string
  versionPatchModel: VersionPatchModel
}
export type DeleteVersionApiResponse = unknown
export type DeleteVersionApiArg = {
  projectName: string
  versionId: string
}
export type CreateVersionApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateVersionApiArg = {
  projectName: string
  versionPostModel: VersionPostModel
}
export type AffectedEntity = {
  entityType: string
  entityId: string
  thumbnailHash: string
  thumbnailId?: string | null
}
export type CreateThumbnailResponseModel = {
  id: string
  affectedEntities?: AffectedEntity[] | null
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
export type FilmstripModel = {
  fileId: string
  url: string
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}
export type VersionModel = {
  /** Unique identifier of the entity */
  id?: string
  /** Version number */
  version: number
  /** ID of the parent product */
  productId: string
  /** ID of the parent task */
  taskId?: string | null
  thumbnailId?: string | null
  author?: string | null
  path?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
  /** List of attributes explicitly set on the entity itself (not inherited) */
  ownAttrib?: string[]
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type VersionPatchModel = {
  /** Version number */
  version?: number | null
  /** ID of the parent product */
  productId?: string | null
  /** ID of the parent task */
  taskId?: string | null
  thumbnailId?: string | null
  author?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[] | null
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  } | null
  /** Whether the entity is active */
  active?: boolean | null
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type VersionPostModel = {
  /** Unique identifier of the entity */
  id?: string
  /** Version number */
  version: number
  /** ID of the parent product */
  productId: string
  /** ID of the parent task */
  taskId?: string | null
  thumbnailId?: string | null
  author?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
}
