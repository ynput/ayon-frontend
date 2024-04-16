import { ayonApi } from '../ayon'
// import PubSub from '/src/pubsub'
import { ENTITY_ACTIVITIES, ENTITY_TOOLTIP, ENTITY_VERSIONS } from './activityQueries'
import { compareAsc } from 'date-fns'

// Helper function to get a nested property of an object using a string path
const getNestedProperty = (obj, path) => path.split('.').reduce((o, p) => (o || {})[p], obj)

// Helper function to delete a nested property of an object using a string path
const deleteNestedProperty = (obj, path) => {
  const pathParts = path.split('.')
  const lastPart = pathParts.pop()
  const target = pathParts.reduce((o, p) => (o || {})[p], obj)
  if (target && lastPart) {
    delete target[lastPart]
  }
}

function remapNestedProperties(object, remappingItems) {
  const transformedObject = { ...object }

  for (const [key, newKey] of Object.entries(remappingItems)) {
    if (getNestedProperty(transformedObject, key) !== undefined) {
      // Get deeply nested value from key using "." notation
      transformedObject[newKey] = getNestedProperty(transformedObject, key)
      // Delete the old key from the object
      deleteNestedProperty(transformedObject, key)
    }
  }

  return transformedObject
}

// we flatten the activity object a little bit
const transformActivityData = (data = {}, currentUser) => {
  const activities = []
  // loop over each activity and remap the nested properties
  data?.project?.task?.activities?.edges?.forEach((edge) => {
    // remapping keys are the fields path in the object
    // and the values are the new keys to assign the values to
    const data = edge.node

    if (!data) {
      return
    }

    const activityNode = data

    // check that the activity hasn't already been added.
    if (activities.some(({ activityId }) => activityId === activityNode.activityId)) {
      // oh no this shouldn't happen!
      // referenceType priorities in order: origin, mention, relation

      // check the referenceType and if the priority is higher than the current one, place the activity in the list
      if (['origin', 'mention'].includes(activityNode.referenceType)) {
        const index = activities.findIndex(
          ({ activityId }) => activityId === activityNode.activityId,
        )
        if (index !== -1) {
          activities[index] = { ...activityNode }
        }
      }

      return
    }

    // remapping of nested properties to flat properties
    const remappingItems = {
      'author.name': 'authorName',
      'author.attrib.fullName': 'authorFullName',
      'author.attrib.avatarUrl': 'authorAvatarUrl',
    }

    const transformedActivity = remapNestedProperties(activityNode, remappingItems)

    // add isOwner property
    const isOwner = currentUser === transformedActivity.authorName
    transformedActivity.isOwner = isOwner

    // parse fields that are JSON strings
    const jsonFields = ['activityData']

    jsonFields.forEach((field) => {
      if (activityNode[field]) {
        try {
          transformedActivity[field] = JSON.parse(activityNode[field])
        } catch (e) {
          console.error('Error parsing JSON field', field, activityNode[field])
        }
      }
    })

    activities.push(transformedActivity)
  }) || []

  return activities
}
// we flatten the version object a little bit
const transformVersionsData = (data = {}, currentUser) => {
  const versions = []
  // loop over each activity and remap the nested properties
  data?.project?.versions?.edges?.forEach((edge) => {
    // remapping keys are the fields path in the object
    // and the values are the new keys to assign the values to
    const data = edge.node

    if (!data) {
      return
    }

    const versionNode = data

    // add isOwner
    const isOwner = currentUser === versionNode.author?.name

    const transformedVersion = { ...versionNode, isOwner }
    transformedVersion.isOwner = isOwner

    versions.push(transformedVersion)
  }) || []

  return versions
}

const transformTaskTooltip = (data = {}) => {
  const { id, label, name, status, thumbnailId, assignees, taskType, folder = {} } = data
  const tooltip = {
    id,
    type: 'task',
    title: label || name,
    subTitle: folder.label || folder.name,
    status,
    thumbnailId,
    users: assignees,
    entityType: taskType,
    path: folder.path,
  }

  return tooltip
}

const transformVersionTooltip = (data = {}) => {
  const { id, name, status, thumbnailId, author, product = {} } = data
  const tooltip = {
    id,
    type: 'version',
    title: name,
    subTitle: product.name,
    status,
    thumbnailId,
    users: [author],
    entityType: product.productType,
    path: product.folder?.path,
  }

  return tooltip
}

// different types have different tooltip data, we need to create a single data model
const transformTooltipData = (data = {}, type) => {
  switch (type) {
    case 'task':
      return transformTaskTooltip(data.task)
    case 'version':
      return transformVersionTooltip(data.version)
    default:
      return {}
  }
}

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
    }),
  }),
})

//

export const { useGetActivitiesQuery, useGetVersionsQuery, useGetEntityTooltipQuery } =
  getActivities
