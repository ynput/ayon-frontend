import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEntityGroups: build.query<GetEntityGroupsApiResponse, GetEntityGroupsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/grouping/${queryArg.entityType}/${queryArg.groupingKey}`,
        params: {
          empty: queryArg.empty,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetEntityGroupsApiResponse = /** status 200 Successful Response */ EntityGrouping
export type GetEntityGroupsApiArg = {
  groupingKey: string
  projectName: string
  /** Project level entity type is used in the endpoint path to specify the type of entity to operate on. It is usually one of 'folders', 'products', 'versions', 'representations', 'tasks', 'workfiles'. (trailing 's' is optional). */
  entityType: string
  empty?: boolean
}
export type EntityGroup = {
  /** The value used for grouping entities. */
  value?: any
  /** A label for the grouping, if applicable. */
  label?: string
  /** An icon representing the grouping, if applicable. */
  icon?: string
  /** A color associated with the grouping, if applicable. */
  color?: string
  /** The number of tasks in this grouping. */
  count?: number
}
export type EntityGrouping = {
  /** List of task groups based on the specified grouping key. */
  groups: EntityGroup[]
  /** The key used for grouping tasks. */
  key: string
  /** The type of entity being grouped, e.g., 'task' or 'folder'. */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
