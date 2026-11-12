import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    enroll: build.mutation<EnrollApiResponse, EnrollApiArg>({
      query: (queryArg) => ({
        url: `/api/enroll`,
        method: 'POST',
        body: queryArg.enrollRequestModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    postEvent: build.mutation<PostEventApiResponse, PostEventApiArg>({
      query: (queryArg) => ({
        url: `/api/events`,
        method: 'POST',
        body: queryArg.dispatchEventRequestModel,
      }),
    }),
    getEvent: build.query<GetEventApiResponse, GetEventApiArg>({
      query: (queryArg) => ({ url: `/api/events/${queryArg.eventId}` }),
    }),
    updateExistingEvent: build.mutation<UpdateExistingEventApiResponse, UpdateExistingEventApiArg>({
      query: (queryArg) => ({
        url: `/api/events/${queryArg.eventId}`,
        method: 'PATCH',
        body: queryArg.updateEventRequestModel,
      }),
    }),
    deleteEvent: build.mutation<DeleteEventApiResponse, DeleteEventApiArg>({
      query: (queryArg) => ({ url: `/api/events/${queryArg.eventId}`, method: 'DELETE' }),
    }),
    eventOperations: build.mutation<EventOperationsApiResponse, EventOperationsApiArg>({
      query: (queryArg) => ({
        url: `/api/eventops`,
        method: 'POST',
        body: queryArg.eventOperationModel,
      }),
    }),
    query: build.mutation<QueryApiResponse, QueryApiArg>({
      query: (queryArg) => ({
        url: `/api/query`,
        method: 'POST',
        body: queryArg.queryRequestModel,
      }),
    }),
    queryTasksFolders: build.mutation<QueryTasksFoldersApiResponse, QueryTasksFoldersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasksFolders`,
        method: 'POST',
        body: queryArg.tasksFoldersQuery,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type EnrollApiResponse = /** status 200 Successful Response */ EnrollResponseModel
export type EnrollApiArg = {
  'x-sender'?: string | null
  'x-sender-type'?: string
  enrollRequestModel: EnrollRequestModel
}
export type PostEventApiResponse = /** status 200 Successful Response */ DispatchEventResponseModel
export type PostEventApiArg = {
  dispatchEventRequestModel: DispatchEventRequestModel
}
export type GetEventApiResponse = /** status 200 Successful Response */ EventModel
export type GetEventApiArg = {
  eventId: string
}
export type UpdateExistingEventApiResponse = unknown
export type UpdateExistingEventApiArg = {
  eventId: string
  updateEventRequestModel: UpdateEventRequestModel
}
export type DeleteEventApiResponse = unknown
export type DeleteEventApiArg = {
  eventId: string
}
export type EventOperationsApiResponse = /** status 200 Successful Response */ any
export type EventOperationsApiArg = {
  eventOperationModel: EventOperationModel
}
export type QueryApiResponse = /** status 200 Successful Response */ {
  [key: string]: any
}[]
export type QueryApiArg = {
  queryRequestModel: QueryRequestModel
}
export type QueryTasksFoldersApiResponse =
  /** status 200 Successful Response */ TasksFoldersResponse
export type QueryTasksFoldersApiArg = {
  projectName: string
  tasksFoldersQuery: TasksFoldersQuery
}
export type EnrollResponseModel = {
  id: string
  dependsOn: string
  hash: string
  status?: string
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
export type EnrollRequestModel = {
  sourceTopic: string | string[]
  targetTopic: string
  sender?: string | null
  senderType?: string | null
  /** Short, human readable description of the target event */
  description?: string | null
  /** Ensure events are processed in sequential order */
  sequential?: boolean
  /** Filter source events */
  filter?: QueryFilter | null
  maxRetries?: number
  /** Ignore source events created by specified sender types */
  ignoreSenderTypes?: string[] | null
  /** Ignore events older than this many days. Use 0 for no limit */
  ignoreOlderThan?: number
  /** Causes enroll endpoint to be really really slow. This flag is for development and testing purposes only. Never use it in production. */
  slothMode?: boolean
}
export type DispatchEventResponseModel = {
  /** ID of the created event. */
  id: string
}
export type DispatchEventRequestModel = {
  /** Topic of the event */
  topic: string
  /** Identifier of the process that sent the event. */
  sender?: string | null
  /** Deterministic hash of the event topic and summary/payload */
  hash?: string | null
  /** Name of the project if the event belong to one. */
  project?: string | null
  /** ID of the event this event depends on. */
  dependsOn?: string | null
  /** Short, human-readable description of the event and its state */
  description?: string | null
  /** Arbitrary topic-specific data sent to clients in real time */
  summary?: {
    [key: string]: any
  }
  /** Full event payload. Only avaiable in REST endpoint. */
  payload?: {
    [key: string]: any
  }
  /** Is event finished (one shot event) */
  finished?: boolean
  /** Set to False for fire-and-forget events */
  store?: boolean
  /** Allow reusing events with the same hash */
  reuse?: boolean
}
export type EventModel = {
  id?: string
  hash: string
  topic: string
  /** Identifier of the process that sent the event. */
  sender?: string | null
  senderType?: string | null
  /** Name of the project if the event belong to one. */
  project?: string | null
  user?: string | null
  /** ID of the event this event depends on. */
  dependsOn?: string | null
  status?: 'pending' | 'in_progress' | 'finished' | 'failed' | 'aborted' | 'restarted'
  retries?: number
  /** Short, human-readable description of the event and its state */
  description?: string | null
  /** Arbitrary topic-specific data sent to clients in real time */
  summary?: {
    [key: string]: any
  }
  /** Full event payload. Only avaiable in REST endpoint. */
  payload?: {
    [key: string]: any
  }
  createdAt?: string
  updatedAt?: string
}
export type UpdateEventRequestModel = {
  /** Identifier of the process that sent the event. */
  sender?: string | null
  /** Deprecated use 'project' instead */
  projectName?: string | null
  /** Name of the project if the event belong to one. */
  project?: string | null
  user?: string | null
  status?: ('pending' | 'in_progress' | 'finished' | 'failed' | 'aborted' | 'restarted') | null
  /** Short, human-readable description of the event and its state */
  description?: string | null
  summary?: {
    [key: string]: any
  } | null
  payload?: {
    [key: string]: any
  } | null
  /** Percentage of progress. Transmitted to clients in real time. */
  progress?: number | null
  /** Force number of attempted retries */
  retries?: number | null
}
export type EventOperationModel = {
  type: 'delete' | 'restart' | 'abort'
  /** Filter source events */
  filter: QueryFilter
}
export type QueryRequestModel = {
  entity:
    | 'event'
    | 'project'
    | 'user'
    | 'folder'
    | 'product'
    | 'task'
    | 'version'
    | 'representation'
    | 'workfile'
  /** Filter events */
  filter?: QueryFilter | null
  /** Maximum number of events to return */
  limit?: number
  /** Offset of the first event to return */
  offset?: number
}
export type TasksFoldersResponse = {
  /** List of folder ids containing tasks matching the query */
  folderIds?: string[]
}
export type TasksFoldersQuery = {
  /** Filter object used to resolve the tasks */
  filter?: QueryFilter | null
  /** 'fulltext' search used to resolve the tasks */
  search?: string | null
}
