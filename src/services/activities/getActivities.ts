import { isEqual } from 'lodash'
import api from '@api'
import { taskProvideTags } from '../userDashboard/userDashboardHelpers'
import {
  ActivitiesResult,
  countChecklists,
  transformActivityData,
  transformTooltipData,
} from './activitiesHelpers'
// import PubSub from '@/pubsub'
import { ENTITY_TOOLTIP, EntityTooltipQuery } from './activityQueries'

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import {
  GetActivitiesByIdQuery,
  GetActivitiesQuery,
  GetEntitiesChecklistsQuery,
} from '@api/graphql'
import { ChecklistCount } from './types'
type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetActivitiesById'> & {
  GetActivitiesById: OverrideResultType<Definitions['GetActivitiesById'], ActivitiesResult>
  GetActivities: OverrideResultType<Definitions['GetActivities'], ActivitiesResult>
  GetEntitiesChecklists: OverrideResultType<Definitions['GetEntitiesChecklists'], ChecklistCount>
}

const enhanceActivitiesApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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
                id: type,
              })),
              // filter is used when a comment is made, to refetch the activities of other filters
              ...(Array.isArray(entityIds) ? entityIds : [entityIds]).map((id) => ({
                type: 'entityActivities',
                id: id + '-' + filter,
              })),
            ]
          : [{ type: 'activity', id: 'LIST' }],
      // don't include the name or cursor in the query args cache key
      serializeQueryArgs: ({ queryArgs: { projectName, entityIds, activityTypes } }) => ({
        projectName,
        entityIds,
        activityTypes,
      }),
      // Always merge incoming data to the cache entry
      merge: (currentCache, newCache) => {
        const { activities = [], pageInfo } = newCache
        const { activities: lastActivities = [] } = currentCache

        const messagesMap = new Map()

        ;[lastActivities, activities].forEach((arr) =>
          arr.forEach((m) => messagesMap.set(m.referenceId, m)),
        )

        const uniqueMessages = Array.from(messagesMap.values())

        // sort the messages by date with the newest first
        uniqueMessages.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )

        return {
          activities: uniqueMessages,
          pageInfo,
        }
      },
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return !isEqual(currentArg, previousArg)
      },
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
  },
})

export const getActivitiesGQLApi = enhanceActivitiesApi.injectEndpoints({
  endpoints: (build) => ({
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
      providesTags: (res, _e, { entityType }) => taskProvideTags([res], 'task', entityType),
    }),
  }),
  overrideExisting: true,
})

//

export const {
  useGetActivitiesQuery,
  useLazyGetActivitiesQuery,
  useGetEntityTooltipQuery,
  useLazyGetActivitiesByIdQuery,
  useGetEntitiesChecklistsQuery,
} = getActivitiesGQLApi
