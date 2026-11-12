import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTask: build.query<GetTaskApiResponse, GetTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
      }),
    }),
    updateTask: build.mutation<UpdateTaskApiResponse, UpdateTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
        method: 'PATCH',
        body: queryArg.taskPatchModel,
      }),
    }),
    deleteTask: build.mutation<DeleteTaskApiResponse, DeleteTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
        method: 'DELETE',
      }),
    }),
    createTask: build.mutation<CreateTaskApiResponse, CreateTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks`,
        method: 'POST',
        body: queryArg.taskPostModel,
      }),
    }),
    assignUsersToTask: build.mutation<AssignUsersToTaskApiResponse, AssignUsersToTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/assign`,
        method: 'POST',
        body: queryArg.assignUsersRequestModel,
      }),
    }),
    queryTasksFolders: build.mutation<QueryTasksFoldersApiResponse, QueryTasksFoldersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasksFolders`,
        method: 'POST',
        body: queryArg.tasksFoldersQuery,
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
    getTaskThumbnail: build.query<GetTaskThumbnailApiResponse, GetTaskThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    getTaskFilmstrip: build.query<GetTaskFilmstripApiResponse, GetTaskFilmstripApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/filmstrip`,
        params: {
          placeholder: queryArg.placeholder,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetTaskApiResponse = /** status 200 Successful Response */ TaskModel
export type GetTaskApiArg = {
  projectName: string
  taskId: string
}
export type UpdateTaskApiResponse = unknown
export type UpdateTaskApiArg = {
  projectName: string
  taskId: string
  taskPatchModel: TaskPatchModel
}
export type DeleteTaskApiResponse = unknown
export type DeleteTaskApiArg = {
  projectName: string
  taskId: string
}
export type CreateTaskApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateTaskApiArg = {
  projectName: string
  taskPostModel: TaskPostModel
}
export type AssignUsersToTaskApiResponse = unknown
export type AssignUsersToTaskApiArg = {
  projectName: string
  taskId: string
  assignUsersRequestModel: AssignUsersRequestModel
}
export type QueryTasksFoldersApiResponse =
  /** status 200 Successful Response */ TasksFoldersResponse
export type QueryTasksFoldersApiArg = {
  projectName: string
  tasksFoldersQuery: TasksFoldersQuery
}
export type CreateTaskThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateTaskThumbnailApiArg = {
  projectName: string
  taskId: string
  'content-type'?: string | null
}
export type GetTaskThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetTaskThumbnailApiArg = {
  projectName: string
  taskId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type GetTaskFilmstripApiResponse = /** status 200 Successful Response */ FilmstripModel
export type GetTaskFilmstripApiArg = {
  projectName: string
  taskId: string
  placeholder?: 'empty' | 'none'
}
export type TaskModel = {
  /** Unique identifier of the entity */
  id?: string
  name: string
  label?: string | null
  taskType: string
  thumbnailId?: string | null
  /** List of users assigned to the task */
  assignees?: string[]
  /** ID of the parent folder */
  folderId?: string | null
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
export type TaskPatchModel = {
  name?: string | null
  label?: string | null
  taskType?: string | null
  thumbnailId?: string | null
  /** List of users assigned to the task */
  assignees?: string[] | null
  /** ID of the parent folder */
  folderId?: string | null
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
export type TaskPostModel = {
  /** Unique identifier of the entity */
  id?: string
  name: string
  label?: string | null
  taskType: string
  thumbnailId?: string | null
  /** List of users assigned to the task */
  assignees?: string[]
  /** ID of the parent folder */
  folderId?: string | null
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
export type AssignUsersRequestModel = {
  /** What to do with the list of users */
  mode: 'add' | 'remove' | 'set'
  /** List of user names */
  users: string[]
}
export type TasksFoldersResponse = {
  /** List of folder ids containing tasks matching the query */
  folderIds?: string[]
}
export type QueryCondition = {
  /** Path to the key separated by slashes */
  key: string
  /** Value to compare against */
  value?: string | number | number | boolean | string[] | number[] | number[] | null
  /** Comparison operator. like and notlike perform case-insensitive substring matching. One surrounding pair of % is treated as a substring wrapper; %, _ and backslashes within it are literal. */
  operator?:
    | 'eq'
    | 'like'
    | 'notlike'
    | 're'
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
export type TasksFoldersQuery = {
  /** Filter object used to resolve the tasks */
  filter?: QueryFilter | null
  /** 'fulltext' search used to resolve the tasks */
  search?: string | null
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
export type FilmstripModel = {
  fileId: string
  url: string
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}
