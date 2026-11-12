import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
    getWorkfileThumbnail: build.query<GetWorkfileThumbnailApiResponse, GetWorkfileThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    getWorkfile: build.query<GetWorkfileApiResponse, GetWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
      }),
    }),
    updateWorkfile: build.mutation<UpdateWorkfileApiResponse, UpdateWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
        method: 'PATCH',
        body: queryArg.workfilePatchModel,
      }),
    }),
    deleteWorkfile: build.mutation<DeleteWorkfileApiResponse, DeleteWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
        method: 'DELETE',
      }),
    }),
    createWorkfile: build.mutation<CreateWorkfileApiResponse, CreateWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles`,
        method: 'POST',
        body: queryArg.workfilePostModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type CreateWorkfileThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  'content-type'?: string | null
}
export type GetWorkfileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type GetWorkfileApiResponse = /** status 200 Successful Response */ WorkfileModel
export type GetWorkfileApiArg = {
  projectName: string
  workfileId: string
}
export type UpdateWorkfileApiResponse = unknown
export type UpdateWorkfileApiArg = {
  projectName: string
  workfileId: string
  workfilePatchModel: WorkfilePatchModel
}
export type DeleteWorkfileApiResponse = unknown
export type DeleteWorkfileApiArg = {
  projectName: string
  workfileId: string
}
export type CreateWorkfileApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateWorkfileApiArg = {
  projectName: string
  workfilePostModel: WorkfilePostModel
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
export type WorkfileModel = {
  /** Unique identifier of the entity */
  id?: string
  /** Path to the workfile */
  path: string
  /** ID of the parent task */
  taskId: string
  thumbnailId?: string | null
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
  /** List of attributes explicitly set on the entity itself (not inherited) */
  ownAttrib?: string[]
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type WorkfilePatchModel = {
  /** Path to the workfile */
  path?: string | null
  /** ID of the parent task */
  taskId?: string | null
  thumbnailId?: string | null
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[] | null
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
export type WorkfilePostModel = {
  /** Unique identifier of the entity */
  id?: string
  /** Path to the workfile */
  path: string
  /** ID of the parent task */
  taskId: string
  thumbnailId?: string | null
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
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
