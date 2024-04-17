import { ayonApi } from '../ayon'
import { taskProvideTags } from '../userDashboard/userDashboardHelpers'
import {
  transformActivityData,
  transformTooltipData,
  transformVersionsData,
} from './activitiesHelpers'
// import PubSub from '/src/pubsub'
import { ENTITY_ACTIVITIES, ENTITY_TOOLTIP, ENTITY_VERSIONS } from './activityQueries'
import { compareAsc } from 'date-fns'

const getActivities = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // a single entities activities
    // most often called by getActivities
    getActivity: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ENTITY_ACTIVITIES(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (res, meta, { currentUser }) =>
        transformActivityData(res?.data, currentUser).sort((a, b) =>
          compareAsc(new Date(a.createdAt), new Date(b.createdAt)),
        ),
      providesTags: (result, error, { entityId }) =>
        result
          ? [
              ...result.map((a) => ({ type: 'activity', id: a.activityId })),
              { type: 'entityActivities', id: entityId },
              { type: 'activity', id: 'LIST' },
            ]
          : [{ type: 'activity', id: 'LIST' }],
      // don't include the name in the query args cache key
      // eslint-disable-next-line no-unused-vars
      serializeQueryArgs: ({ queryArgs: { currentUser, ...rest } }) => rest,
    }),
    // getActivities is a custom query that calls getActivity for each entity
    getActivities: build.query({
      async queryFn({ entities = [] }, { dispatch, forced, getState }) {
        console.log('getActivities for all selected entities')
        try {
          const currentUser = getState().user.name
          const allActivities = []
          for (const entity of entities) {
            const { id: entityId, projectName, type: entityType } = entity
            if (!entityId) continue

            // fetch activities for each entity
            const response = await dispatch(
              ayonApi.endpoints.getActivity.initiate(
                { projectName, entityId, entityType, currentUser },
                { forceRefetch: forced },
              ),
            )

            if (response.status === 'rejected') {
              console.error('No activities found', entityId)
              return { error: new Error('No activities found', entityId) }
            }

            response.data.forEach((activitiesData) => {
              // add activities to allActivities
              allActivities.push({ ...activitiesData, entityId: entityId, entityType, projectName })
            })
          }

          return { data: allActivities }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      //   Id is the entity id, incase we want invalidate ALL activities for one or more entities
      providesTags: (result, error, { entities = [] }) =>
        result
          ? [
              ...result.map((a) => ({ type: 'activity', id: a.activityId })),
              ...entities.map((entity) => ({ type: 'entitiesActivities', id: entity.id })),
              { type: 'entitiesActivities', id: 'LIST' },
            ]
          : [{ type: 'entitiesActivities', id: 'LIST' }],
    }),
    // get all versions for a task, used as an activity and version mentions
    getEntityVersions: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ENTITY_VERSIONS(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (res, meta, { currentUser }) =>
        transformVersionsData(res?.data, currentUser).sort((a, b) =>
          compareAsc(new Date(a.createdAt), new Date(b.createdAt)),
        ),
      providesTags: (result) =>
        result
          ? [...result.map((a) => ({ type: 'version', id: a.id })), { type: 'version', id: 'LIST' }]
          : [{ type: 'version', id: 'LIST' }],
      // don't include the name in the query args cache key
      // eslint-disable-next-line no-unused-vars
      serializeQueryArgs: ({ queryArgs: { currentUser, ...rest } }) => rest,
    }),
    // getVersions is a custom query that calls getTaskVersions for each entity
    getVersions: build.query({
      async queryFn({ entities = [] }, { dispatch, forced, getState }) {
        console.log('getVersions for all selected entities')
        try {
          const currentUser = getState().user.name
          const allVersions = []
          for (const entity of entities) {
            const { id: entityId, projectName, type: entityType } = entity
            if (!entityId) continue

            // fetch activities for each entity
            const response = await dispatch(
              ayonApi.endpoints.getEntityVersions.initiate(
                { projectName, entityId, entityType, currentUser },
                { forceRefetch: forced },
              ),
            )

            if (response.status === 'rejected') {
              console.error('No activities found', entityId)
              return { error: new Error('No activities found', entityId) }
            }

            response.data.forEach((versionsData) => {
              // add activities to allVersions
              allVersions.push({ ...versionsData, entityId: entityId, entityType, projectName })
            })
          }

          return { data: allVersions }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      //   Id is the entity id, incase we want invalidate ALL activities for one or more entities
      providesTags: (result, error, { entities = [] }) =>
        result
          ? [
              ...entities.map((entity) => ({ type: 'entitiesVersions', id: entity.id })),
              { type: 'entitiesVersions', id: 'LIST' },
            ]
          : [{ type: 'entitiesVersions', id: 'LIST' }],
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
  }),
})

//

export const { useGetActivitiesQuery, useGetVersionsQuery, useGetEntityTooltipQuery } =
  getActivities
