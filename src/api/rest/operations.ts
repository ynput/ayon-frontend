import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    eventOperations: build.mutation<EventOperationsApiResponse, EventOperationsApiArg>({
      query: (queryArg) => ({
        url: `/api/eventops`,
        method: 'POST',
        body: queryArg.eventOperationModel,
      }),
    }),
    activitiesOperations: build.mutation<
      ActivitiesOperationsApiResponse,
      ActivitiesOperationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/operations/activities`,
        method: 'POST',
        body: queryArg.activityOperationsRequestModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    operations: build.mutation<OperationsApiResponse, OperationsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/operations`,
        method: 'POST',
        body: queryArg.operationsRequestModel,
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
export type EventOperationsApiResponse = /** status 200 Successful Response */ any
export type EventOperationsApiArg = {
  eventOperationModel: EventOperationModel
}
export type ActivitiesOperationsApiResponse =
  /** status 200 Successful Response */ ActivityOperationsResponseModel
export type ActivitiesOperationsApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  activityOperationsRequestModel: ActivityOperationsRequestModel
}
export type OperationsApiResponse = /** status 200 Successful Response */ OperationsResponseModel
export type OperationsApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  operationsRequestModel: OperationsRequestModel
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
export type EventOperationModel = {
  type: 'delete' | 'restart' | 'abort'
  /** Filter source events */
  filter: QueryFilter
}
export type ActivityOperationResponseModel = {
  id: string
  type: 'create' | 'update' | 'delete'
  success: boolean
  status?: number
  detail?: string
  /** `None` if type is `create` and the operation fails. */
  activityId?: string
}
export type ActivityOperationsResponseModel = {
  operations?: ActivityOperationResponseModel[]
  success: boolean
}
export type ActivityOperationModel = {
  /** identifier manually or automatically assigned to each operation */
  id?: string
  type: 'create' | 'update' | 'delete'
  /** ID of the activity. None for create */
  activityId?: string
  /** Data to be used for create or update. Ignored for delete.See create/patch activity endpoint for details */
  data?: object
}
export type ActivityOperationsRequestModel = {
  operations?: ActivityOperationModel[]
  canFail?: boolean
}
export type OperationResponseModel = {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  entityId?: string
  success: boolean
  status: number
  errorCode?: string
  detail?: string
}
export type OperationsResponseModel = {
  operations?: OperationResponseModel[]
  success: boolean
}
export type OperationModel = {
  id?: string
  type: 'create' | 'update' | 'delete'
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  entityId?: string
  data?: Record<string, any>
  force?: boolean
  asUser?: string
}
export type OperationsRequestModel = {
  operations?: OperationModel[]
  canFail?: boolean
}
