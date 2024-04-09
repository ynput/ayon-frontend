import { ayonApi } from '../ayon'
// import PubSub from '/src/pubsub'
import { ENTITY_ACTIVITIES } from './activityQueries'
import { compareAsc } from 'date-fns'

// remapping of nested properties to flat properties
const remappingItems = {
  'author.name': 'authorName',
  'author.attrib.fullName': 'authorFullName',
  'author.attrib.avatarUrl': 'authorAvatarUrl',
}

// we flatten the activity object a little bit
const transformActivityData = (data = {}) => {
  const activities = []
  // loop over each activity and remap the nested properties
  data?.project?.task?.activities?.edges?.forEach((edge) => {
    // remapping keys are the fields path in the object
    // and the values are the new keys to assign the values to

    if (!edge.node) {
      console.error('No node found in activity edge')
      return
    }

    const activityNode = edge.node
    const transformedActivity = { ...edge.node }

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

    //   Here we do the remapping of the nested properties
    for (const [key, newKey] of Object.entries(remappingItems)) {
      if (getNestedProperty(activityNode, key) !== undefined) {
        // Get deeply nested value from key using "." notation
        transformedActivity[newKey] = getNestedProperty(activityNode, key)
        // Delete the old key from the activity
        deleteNestedProperty(activityNode, key)
      }
    }

    activities.push(transformedActivity)
  }) || []
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
      transformResponse: (res) =>
        transformActivityData(res?.data).sort((a, b) =>
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
    }),
    // getActivities is a custom query that calls getActivity for each entity
    getActivities: build.query({
      async queryFn({ entities = [] }, { dispatch }) {
        try {
          const allActivities = []
          for (const entity of entities) {
            const { id: entityId, projectName, type: entityType } = entity
            if (!entityId) continue

            // fetch activities for each entity
            const response = await dispatch(
              ayonApi.endpoints.getActivity.initiate(
                { projectName, entityId, entityType },
                { forceRefetch: false },
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
  }),
})

//

export const { useGetActivitiesQuery } = getActivities
