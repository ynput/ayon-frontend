import {
  gqlApi,
  GetActivitiesByIdQuery,
  GetActivitiesQuery,
  GetActivitiesQueryVariables,
  GetActivityUsersQuery,
  GetEntitiesChecklistsQuery,
} from '@shared/api/generated'
import { taskProvideTags } from './util/activitiesHelpers'
import {
  ActivitiesResult,
  countChecklists,
  transformActivityData,
  transformTooltipData,
} from './util/activitiesHelpers'
import { ENTITY_TOOLTIP, EntityTooltipQuery } from './activityQueries'

import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import { ChecklistCount } from './types'

type ActivityUserNode = GetActivityUsersQuery['users']['edges'][0]['node']

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetActivitiesById'> & {
  GetActivitiesById: OverrideResultType<Definitions['GetActivitiesById'], ActivitiesResult>
  GetActivities: OverrideResultType<Definitions['GetActivities'], ActivitiesResult>
  GetEntitiesChecklists: OverrideResultType<Definitions['GetEntitiesChecklists'], ChecklistCount>
  GetActivityUsers: OverrideResultType<Definitions['GetActivityUsers'], ActivityUserNode[]>
}

const enhanceActivitiesApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetActivities: {
      transformResponse: (res: GetActivitiesQuery) =>
        transformActivityData(res.project.activities.edges, res.project.activities.pageInfo),
      // @ts-expect-error - filter is not an query arg
      providesTags: (result, _e, { entityIds, activityTypes = [], filter }) =>
        result
          ? [
              ...result.activities.map((a) => ({ type: 'activity', id: a.activityId })),
              { type: 'activity', id: 'LIST' },
              ...(Array.isArray(entityIds) ? entityIds : [entityIds]).map((id) => ({
                type: 'entityActivities',
                id: id,
              })),
              { type: 'entityActivities', id: 'LIST' },
              ...(Array.isArray(activityTypes) ? activityTypes : [activityTypes])?.map((type) => ({
                type: 'entityActivities',
                id: type as string,
              })),
              // filter is used when a comment is made, to refetch the activities of other filters
              ...(Array.isArray(entityIds) ? entityIds : [entityIds]).map((id) => ({
                type: 'entityActivities',
                id: id + '-' + filter,
              })),
            ]
          : [{ type: 'activity', id: 'LIST' }],
    },
    GetActivitiesById: {
      transformResponse: (res: GetActivitiesByIdQuery) =>
        transformActivityData(res.project.activities.edges, res.project.activities.pageInfo),
    },
    GetEntitiesChecklists: {
      transformResponse: (res: GetEntitiesChecklistsQuery) => countChecklists(res),
      providesTags: (res, _error, { entityIds }) =>
        res
          ? [
              { type: 'activity', id: 'LIST' },
              ...res.ids.map((id) => ({ type: 'activity', id: 'checklist-' + id })),
              ...(Array.isArray(entityIds) ? entityIds : [entityIds]).map((id) => ({
                type: 'entityActivities',
                id: 'checklist-' + id,
              })),
            ]
          : [{ type: 'activity', id: 'LIST' }],
    },
    GetActivityUsers: {
      transformResponse: (res: GetActivityUsersQuery) => res.users.edges.map((edge) => edge.node),
      providesTags: (res) =>
        res?.length
          ? [{ type: 'user', id: 'LIST' }, ...res.map(({ name }) => ({ type: 'user', id: name }))]
          : [{ type: 'user', id: 'LIST' }],
    },
  },
})

const ACTIVITIES_INFINITE_QUERY_COUNT = 30

const getActivitiesGQLApi = enhanceActivitiesApi.injectEndpoints({
  endpoints: (build) => ({
    getActivitiesInfinite: build.infiniteQuery<
      ActivitiesResult,
      Omit<GetActivitiesQueryVariables, 'last' | 'first' | 'cursor'> & { filter?: string },
      { cursor: string; first?: number; last?: number }
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '', last: ACTIVITIES_INFINITE_QUERY_COUNT },
        // Calculate the next page param based on current page response and params
        getNextPageParam: (lastPage) => {
          const pageInfo = lastPage.pageInfo
          const hasPreviousPage = pageInfo.hasPreviousPage

          if (!hasPreviousPage || !pageInfo.endCursor) return undefined

          return {
            cursor: pageInfo.endCursor,
            last: ACTIVITIES_INFINITE_QUERY_COUNT,
          }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const { filter, ...args } = queryArg
          // Build the query parameters for GetActivities
          const queryParams: GetActivitiesQueryVariables = {
            ...args,
            before: pageParam?.cursor,
            last: pageParam?.last,
          }

          // Call the existing GetActivities endpoint
          const result = await api.dispatch(
            enhanceActivitiesApi.endpoints.GetActivities.initiate(queryParams, {
              forceRefetch: true,
            }),
          )

          if (result.error) throw result.error
          const fallback = {
            activities: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
              startCursor: null,
              hasPreviousPage: false,
            },
          }

          // Return the activities directly as required by the infinite query format
          return {
            data: result.data || fallback,
          }
        } catch (e: any) {
          console.error('Error in getActivitiesInfinite queryFn:', e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      providesTags: (result, _e, { entityIds, activityTypes, filter }) =>
        result
          ? [
              ...result.pages
                .flatMap((page) => page.activities)
                .map((a) => ({ type: 'activity', id: a.activityId })),
              { type: 'activity', id: 'LIST' },
              ...(Array.isArray(entityIds) ? entityIds : [entityIds]).filter(Boolean).map((id) => ({
                type: 'entityActivities',
                id: id as string,
              })),
              { type: 'entityActivities', id: 'LIST' },
              ...(Array.isArray(activityTypes) ? activityTypes : [activityTypes])
                ?.filter(Boolean)
                .map((type) => ({
                  type: 'entityActivities',
                  id: type as string,
                })),
              // filter is used when a comment is made, to refetch the activities of other filters
              ...(Array.isArray(entityIds) ? entityIds : [entityIds]).filter(Boolean).map((id) => ({
                type: 'entityActivities',
                id: `${id}-${filter}`,
              })),
            ]
          : [{ type: 'activity', id: 'LIST' }],
    }),
    // get data for a reference tooltip based on type,id and projectName
    getEntityTooltip: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ENTITY_TOOLTIP(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (res: EntityTooltipQuery, _m, { entityType }) =>
        transformTooltipData(res?.data?.project, entityType),
      providesTags: (res: any, _e, { entityType }) => taskProvideTags([res], 'task', entityType),
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetEntityTooltipQuery,
  useLazyGetActivitiesByIdQuery,
  useGetEntitiesChecklistsQuery,
  useGetActivitiesInfiniteInfiniteQuery,
  useGetActivityUsersQuery,
} = getActivitiesGQLApi
export default getActivitiesGQLApi
