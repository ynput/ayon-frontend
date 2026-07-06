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
  filterKey,
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
import { handleActivityRealtimeUpdates } from './util/activityRealtimeHandler'

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
    // Only used by the infinite query below
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
                id: id + '-' + filterKey(filter),
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
      Omit<GetActivitiesQueryVariables, 'last' | 'first' | 'cursor'> & { filter?: any },
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
      async onCacheEntryAdded(
        queryArg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        await handleActivityRealtimeUpdates(queryArg, {
          updateCachedData,
          cacheDataLoaded,
          cacheEntryRemoved,
          dispatch,
          getCacheEntry,
          gqlApi: enhanceActivitiesApi,
        })
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
                id: `${id}-${filterKey(filter)}`,
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
  useGetActivitiesQuery,
  useGetActivitiesInfiniteInfiniteQuery,
  useGetActivityUsersQuery,
} = getActivitiesGQLApi

export { getActivitiesGQLApi }

import { filterActivityTypes } from './util/activitiesHelpers'
import { patchTableLatestComments } from './patchTableLatestComments'

const updateCache = (activitiesDraft: any, patch: any, isDelete: boolean) => {
  // Handle paginated structure
  if (isDelete) {
    // Remove from any page where it exists
    for (const page of activitiesDraft.pages) {
      const index = page.activities.findIndex((a: any) => a.activityId === patch.activityId)
      if (index !== -1) {
        page.activities.splice(index, 1)
        return
      }
    }
  } else {
    // Try to update existing activity
    let activityFound = false

    for (const page of activitiesDraft.pages) {
      const index = page.activities.findIndex((a: any) => a.activityId === patch.activityId)
      if (index !== -1) {
        // Update the activity
        page.activities[index] = { ...page.activities[index], ...patch }
        activityFound = true
        break
      }
    }

    // If activity doesn't exist and this is not a delete operation, add to first page
    if (!activityFound && activitiesDraft.pages.length > 0) {
      activitiesDraft.pages[0].activities.unshift(patch)
    }
  }
}

const serializeFilter = (filter: unknown): string => {
  if (filter === undefined || filter === null) return ''
  return typeof filter === 'string' ? filter : JSON.stringify(filter)
}

const patchActivities = async (
  { patch, entityIds = [], filter, refs = [], ...rest }: any,
  api: any,
  method: 'create' | 'update' | 'delete',
) => {
  const { dispatch, queryFulfilled, getState } = api
  const refIds = refs.map((ref: any) => ref.id) || []
  const serializedFilter = serializeFilter(filter)
  // build tags that would be affected by this activity
  const invalidatingTags = [...entityIds, ...refIds].map((id) => ({
    type: 'entityActivities',
    id: id + '-' + filterKey(filter),
  }))

  const state = getState()
  // get caches that would be affected by this activity
  const entries = getActivitiesGQLApi.util.selectInvalidatedBy(state, invalidatingTags)

  // ensure that data is mapped to activityData
  if (method !== 'delete' && patch.data) {
    patch.activityData = { ...patch.activityData, ...patch.data }
  }

  // now patch all the caches with the update
  const patches = entries.map(({ originalArgs }) =>
    dispatch(
      getActivitiesGQLApi.util.updateQueryData('getActivitiesInfinite', originalArgs, (draft) =>
        updateCache(draft, patch, method === 'delete'),
      ),
    ),
  )

  // patch latestComments in the table caches too (instead of refetching them)
  const tablePatches = patchTableLatestComments(
    { patch, entityIds, filter, refs, ...rest },
    api,
    method,
  )

  try {
    await queryFulfilled
  } catch (error: any) {
    for (const patchResult of [...patches, ...tablePatches]) {
      patchResult?.undo()
    }
  }
}

// get tags for other filter types
const getTags = ({ entityId, filter }: { entityId: string; filter: string }) => {
  const invalidateFilters = Object.keys(filterActivityTypes).filter((key) => key !== filter)

  const tags = invalidateFilters.map((filter) => ({
    type: 'entityActivities',
    id: entityId + '-' + filter,
  }))

  tags.push({ type: 'activity', id: 'LIST' })

  tags.push({ type: 'watchers', id: entityId })

  return tags
}

const updateActivitiesApi = getActivitiesGQLApi.injectEndpoints({
  endpoints: (build) => ({
    createEntityActivity: build.mutation({
      query: ({ projectName, entityType, entityId, data = {} }) => ({
        url: `/api/projects/${projectName}/${entityType}/${entityId}/activities`,
        method: 'POST',
        // generate a new activityId if this is a new activity
        body: data,
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'create')
      },
      // invalidate other filters that might be affected by this new activity (comments, checklists, etc)
      invalidatesTags: (result, error, { entityId, filter }) => getTags({ entityId, filter }),
    }),

    updateActivity: build.mutation({
      query: ({ projectName, activityId, data }) => ({
        url: `/api/projects/${projectName}/activities/${activityId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'update')
      },
      // invalidate other filters that might be affected by this new activity (comments, checklists, etc)
      invalidatesTags: (result, error, { entityId, filter }) => getTags({ entityId, filter }),
    }),
    deleteActivity: build.mutation({
      query: ({ projectName, activityId }) => ({
        url: `/api/projects/${projectName}/activities/${activityId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(args, api) {
        patchActivities(args, api, 'delete')
      },
      // invalidate other filters that might be affected by this new activity (comments, checklists, etc)
      invalidatesTags: (result, error, { entityId, filter }) => getTags({ entityId, filter }),
    }),
  }),
  overrideExisting: true,
})

export const {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} = updateActivitiesApi
export { updateActivitiesApi as activitiesQueries }
