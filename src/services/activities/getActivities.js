import { isEqual } from 'lodash'
import api from '@api'
import { taskProvideTags } from '../userDashboard/userDashboardHelpers'
import { countChecklists, transformActivityData, transformTooltipData } from './activitiesHelpers'
// import PubSub from '@/pubsub'
import { ACTIVITIES, ACTIVITIES_BY_ACTIVITY, CHECKLISTS, ENTITY_TOOLTIP } from './activityQueries'

const getActivities = api.injectEndpoints({
  endpoints: (build) => ({
    // get multiple entities activities
    getActivities: build.query({
      query: ({ projectName, entityIds, cursor, last, referenceTypes, activityTypes }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ACTIVITIES,
          variables: { projectName, entityIds, cursor, last, referenceTypes, activityTypes },
        },
      }),
      transformResponse: (res, meta, { currentUser }) =>
        transformActivityData(res?.data, currentUser),
      providesTags: (result, error, { entityIds, activityTypes = [], filter }) =>
        result
          ? [
              ...result.activities.map((a) => ({ type: 'activity', id: a.activityId })),
              { type: 'activity', id: 'LIST' },
              ...entityIds.map((id) => ({ type: 'entityActivities', id: id })),
              { type: 'entityActivities', id: 'LIST' },
              ...activityTypes.map((type) => ({ type: 'entityActivities', id: type })),
              // filter is used when a comment is made, to refetch the activities of other filters
              ...entityIds.map((id) => ({ type: 'entityActivities', id: id + '-' + filter })),
            ]
          : [{ type: 'activity', id: 'LIST' }],
      // don't include the name or cursor in the query args cache key
      serializeQueryArgs: ({ queryArgs: { projectName, entityIds, activityTypes, filter } }) => ({
        projectName,
        entityIds,
        activityTypes,
        filter,
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
        uniqueMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

        return {
          activities: uniqueMessages,
          pageInfo,
        }
      },
      // Refetch when the page arg changes
      forceRefetch({ currentArg, previousArg }) {
        return !isEqual(currentArg, previousArg)
      },
    }),
    // get a single activity
    getActivityForEntities: build.query({
      query: ({ projectName, entityIds, activityIds }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ACTIVITIES_BY_ACTIVITY,
          variables: { projectName, entityIds, activityIds },
        },
      }),
      transformResponse: (res, meta, { currentUser }) =>
        transformActivityData(res?.data, currentUser, false),
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
      transformResponse: (res, meta, { entityType }) =>
        transformTooltipData(res?.data?.project, entityType),
      providesTags: (res, error, { entityType }) => taskProvideTags([res], 'task', entityType),
    }),
    getChecklistsCount: build.query({
      query: ({ projectName, entityIds }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: CHECKLISTS,
          variables: { projectName, entityIds },
        },
      }),
      transformResponse: (res) => countChecklists(res?.data),
      providesTags: (res, _error, { entityIds }) => [
        { type: 'activity', id: 'LIST' },
        ...res.ids.map((id) => ({ type: 'activity', id: 'checklist-' + id })),
        ...entityIds.map((id) => ({ type: 'entityActivities', id: 'checklist-' + id })),
      ],
    }),
  }),
  overrideExisting: true,
})

//

export const {
  useGetActivitiesQuery,
  useLazyGetActivitiesQuery,
  useGetEntityTooltipQuery,
  useLazyGetActivityForEntitiesQuery,
  useGetChecklistsCountQuery,
} = getActivities
