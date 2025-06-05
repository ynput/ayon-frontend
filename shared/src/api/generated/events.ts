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
    deleteEvent: build.mutation<DeleteEventApiResponse, DeleteEventApiArg>({
      query: (queryArg) => ({ url: `/api/events/${queryArg.eventId}`, method: 'DELETE' }),
    }),
    updateExistingEvent: build.mutation<UpdateExistingEventApiResponse, UpdateExistingEventApiArg>({
      query: (queryArg) => ({
        url: `/api/events/${queryArg.eventId}`,
        method: 'PATCH',
        body: queryArg.updateEventRequestModel,
      }),
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
  'x-sender'?: string
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
export type DeleteEventApiResponse = unknown
export type DeleteEventApiArg = {
  eventId: string
}
export type UpdateExistingEventApiResponse = unknown
export type UpdateExistingEventApiArg = {
  eventId: string
  updateEventRequestModel: UpdateEventRequestModel
}
export type EventOperationsApiResponse = /** status 200 Successful Response */ any
export type EventOperationsApiArg = {
  eventOperationModel: EventOperationModel
}
export type QueryApiResponse = /** status 200 Successful Response */ object[]
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
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type QueryCondition = {
  /** Path to the key separated by slashes */
  key: string
  /** Value to compare against */
  value?: string | number | number | boolean | string[] | number[] | number[]
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
export type EnrollRequestModel = {
  sourceTopic: string | string[]
  targetTopic: string
  sender?: string
  senderType?: string
  /** Short, human readable description of the target event */
  description?: string
  /** Ensure events are processed in sequential order */
  sequential?: boolean
  /** Filter source events */
  filter?: QueryFilter
  maxRetries?: number
  /** Ignore source events created by specified sender types */
  ignoreSenderTypes?: string[]
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
  sender?: string
  /** Deterministic hash of the event topic and summary/payload */
  hash?: string
  /** Name of the project if the event belong to one. */
  project?: string
  /** ID of the event this event depends on. */
  dependsOn?: string
  /** Short, human-readable description of the event and its state */
  description?: string
  /** Arbitrary topic-specific data sent to clients in real time */
  summary?: object
  /** Full event payload. Only avaiable in REST endpoint. */
  payload?: object
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
  sender?: string
  senderType?: string
  /** Name of the project if the event belong to one. */
  project?: string
  user?: string
  /** ID of the event this event depends on. */
  dependsOn?: string
  status?: 'pending' | 'in_progress' | 'finished' | 'failed' | 'aborted' | 'restarted'
  retries?: number
  /** Short, human-readable description of the event and its state */
  description?: string
  /** Arbitrary topic-specific data sent to clients in real time */
  summary?: object
  /** Full event payload. Only avaiable in REST endpoint. */
  payload?: object
  createdAt?: string
  updatedAt?: string
}
export type UpdateEventRequestModel = {
  /** Identifier of the process that sent the event. */
  sender?: string
  /** Deprecated use 'project' instead */
  projectName?: string
  /** Name of the project if the event belong to one. */
  project?: string
  user?: string
  status?: 'pending' | 'in_progress' | 'finished' | 'failed' | 'aborted' | 'restarted'
  /** Short, human-readable description of the event and its state */
  description?: string
  summary?: object
  payload?: object
  /** Percentage of progress. Transmitted to clients in real time. */
  progress?: number
  /** Force number of attempted retries */
  retries?: number
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
  filter?: QueryFilter
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
  filter?: QueryFilter
  /** 'fulltext' search used to resolve the tasks */
  search?: string
}
