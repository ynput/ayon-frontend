import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProjectEntityCounts: build.query<
      GetProjectEntityCountsApiResponse,
      GetProjectEntityCountsApiArg
    >({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/entities` }),
    }),
    getProjectHealth: build.query<GetProjectHealthApiResponse, GetProjectHealthApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/health` }),
    }),
    getProjectActivity: build.query<GetProjectActivityApiResponse, GetProjectActivityApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/dashboard/activity`,
        params: {
          days: queryArg.days,
        },
      }),
    }),
    getProjectTeams: build.query<GetProjectTeamsApiResponse, GetProjectTeamsApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/dashboard/users` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetProjectEntityCountsApiResponse = /** status 200 Successful Response */ EntityCounts
export type GetProjectEntityCountsApiArg = {
  projectName: string
}
export type GetProjectHealthApiResponse = /** status 200 Successful Response */ Health
export type GetProjectHealthApiArg = {
  projectName: string
}
export type GetProjectActivityApiResponse =
  /** status 200 Successful Response */ ActivityResponseModel
export type GetProjectActivityApiArg = {
  projectName: string
  /** Number of days to retrieve activity for */
  days?: number
}
export type GetProjectTeamsApiResponse =
  /** status 200 Successful Response */ ProjectTeamsResponseModel
export type GetProjectTeamsApiArg = {
  projectName: string
}
export type EntityCounts = {
  /** Number of folders */
  folders: number
  /** Number of products */
  products: number
  /** Number of versions */
  versions: number
  /** Number of representations */
  representations: number
  /** Number of tasks */
  tasks: number
  /** Number of workfiles */
  workfiles: number
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type HealthCompletion = {
  /** Percentage of tasks completed */
  percentage: number
  /** Number of days tasks are not completed after due date */
  behind: number
  /** Number of days tasks are completed before due date */
  ahead: number
}
export type HealthStorageUsage = {
  /** Storage quota */
  quota: number
  /** Storage used */
  used: number
}
export type HealthTasks = {
  /** Total number of tasks */
  total: number
  /** Number of completed tasks */
  completed: number
  /** Number of overdue tasks */
  overdue: number
}
export type Health = {
  /** Task completion */
  completion: HealthCompletion
  /** Storage usage */
  storageUsage: HealthStorageUsage
  /** Task statistics */
  tasks: HealthTasks
  /** Task status statistics */
  statuses: {
    [key: string]: number
  }
}
export type ActivityResponseModel = {
  /** Activity per day normalized to 0-100 */
  activity: number[]
}
export type ProjectTeamsResponseModel = {
  /** Number of active team members */
  teamSizeActive?: number
  /** Total number of team members */
  teamSizeTotal?: number
  /** Number of active users */
  usersWithAccessActive?: number
  /** Total number of users */
  usersWithAccessTotal?: number
  /** Number of users per role */
  roles: {
    [key: string]: number
  }
}
