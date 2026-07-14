import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
    getWorkfile: build.query<GetWorkfileApiResponse, GetWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
      }),
    }),
    deleteWorkfile: build.mutation<DeleteWorkfileApiResponse, DeleteWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
        method: 'DELETE',
      }),
    }),
    updateWorkfile: build.mutation<UpdateWorkfileApiResponse, UpdateWorkfileApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/workfiles/${queryArg.workfileId}`,
        method: 'PATCH',
        body: queryArg.workfilePatchModel,
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
export type GetWorkfileThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type CreateWorkfileThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateWorkfileThumbnailApiArg = {
  projectName: string
  workfileId: string
  'content-type'?: string
}
export type GetWorkfileApiResponse = /** status 200 Successful Response */ WorkfileModel
export type GetWorkfileApiArg = {
  projectName: string
  workfileId: string
}
export type DeleteWorkfileApiResponse = unknown
export type DeleteWorkfileApiArg = {
  projectName: string
  workfileId: string
}
export type UpdateWorkfileApiResponse = unknown
export type UpdateWorkfileApiArg = {
  projectName: string
  workfileId: string
  workfilePatchModel: WorkfilePatchModel
}
export type CreateWorkfileApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateWorkfileApiArg = {
  projectName: string
  workfilePostModel: WorkfilePostModel
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type AffectedEntity = {
  entityType: string
  entityId: string
  thumbnailHash: string
}
export type CreateThumbnailResponseModel = {
  id: string
  affectedEntities?: AffectedEntity[]
}
export type WorkfileAttribModel = {
  extension?: string
  /** Textual description of the entity */
  description?: string
}
export type WorkfileModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** Path to the workfile */
  path: string
  /** ID of the parent task */
  taskId: string
  thumbnailId?: string
  /** Who created the workfile */
  createdBy?: string
  /** Who last updated the workfile */
  updatedBy?: string
  attrib?: WorkfileAttribModel
  data?: Record<string, any>
  /** Whether the workfile is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the workfile */
  status?: string
  /** Tags assigned to the the workfile */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type WorkfilePatchModel = {
  /** Path to the workfile */
  path?: string
  /** ID of the parent task */
  taskId?: string
  thumbnailId?: string
  /** Who created the workfile */
  createdBy?: string
  /** Who last updated the workfile */
  updatedBy?: string
  /** Status of the workfile */
  status?: string
  /** Tags assigned to the the workfile */
  tags?: string[]
  attrib?: WorkfileAttribModel
  data?: Record<string, any>
  /** Whether the workfile is active */
  active?: boolean
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type WorkfilePostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** Path to the workfile */
  path: string
  /** ID of the parent task */
  taskId: string
  thumbnailId?: string
  /** Who created the workfile */
  createdBy?: string
  /** Who last updated the workfile */
  updatedBy?: string
  /** Status of the workfile */
  status?: string
  /** Tags assigned to the the workfile */
  tags?: string[]
  attrib?: WorkfileAttribModel
  data?: Record<string, any>
  /** Whether the workfile is active */
  active?: boolean
}
