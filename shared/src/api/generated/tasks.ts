import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTask: build.query<GetTaskApiResponse, GetTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
      }),
    }),
    deleteTask: build.mutation<DeleteTaskApiResponse, DeleteTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateTask: build.mutation<UpdateTaskApiResponse, UpdateTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}`,
        method: 'PATCH',
        body: queryArg.taskPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    createTask: build.mutation<CreateTaskApiResponse, CreateTaskApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks`,
        method: 'POST',
        body: queryArg.taskPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
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
export type GetTaskApiResponse = /** status 200 Successful Response */ TaskModel
export type GetTaskApiArg = {
  projectName: string
  taskId: string
}
export type DeleteTaskApiResponse = unknown
export type DeleteTaskApiArg = {
  projectName: string
  taskId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateTaskApiResponse = unknown
export type UpdateTaskApiArg = {
  projectName: string
  taskId: string
  'x-sender'?: string
  'x-sender-type'?: string
  taskPatchModel: TaskPatchModel
}
export type CreateTaskApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateTaskApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
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
export type TaskAttribModel = {
  priority?: 'urgent' | 'high' | 'normal' | 'low'
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
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
}
export type TaskModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  name: string
  label?: string
  taskType: string
  thumbnailId?: string
  /** List of users assigned to the task */
  assignees?: string[]
  /** Folder ID */
  folderId?: string
  attrib?: TaskAttribModel
  data?: Record<string, any>
  /** Whether the task is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the task */
  status?: string
  /** Tags assigned to the the task */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type TaskPatchModel = {
  name?: string
  label?: string
  taskType?: string
  thumbnailId?: string
  /** List of users assigned to the task */
  assignees?: string[]
  /** Folder ID */
  folderId?: string
  /** Status of the task */
  status?: string
  /** Tags assigned to the the task */
  tags?: string[]
  attrib?: TaskAttribModel
  data?: Record<string, any>
  /** Whether the task is active */
  active?: boolean
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type TaskPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  name: string
  label?: string
  taskType: string
  thumbnailId?: string
  /** List of users assigned to the task */
  assignees?: string[]
  /** Folder ID */
  folderId?: string
  /** Status of the task */
  status?: string
  /** Tags assigned to the the task */
  tags?: string[]
  attrib?: TaskAttribModel
  data?: Record<string, any>
  /** Whether the task is active */
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
  value?: string | number | number | string[] | number[] | number[]
  /** Comparison operator */
  operator?:
    | 'eq'
    | 'like'
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
  filter?: QueryFilter
  /** 'fulltext' search used to resolve the tasks */
  search?: string
}
export type CreateThumbnailResponseModel = {
  id: string
}
