import api from '@api'
import { transformEntityData } from '../userDashboard/userDashboardHelpers'
import {
  buildDetailsQuery,
  entityDetailsTypesSupported,
} from '../userDashboard/userDashboardQueries'
import PubSub from '@/pubsub'

const getEntityPanel = api.injectEndpoints({
  endpoints: (build) => ({
    // TODO, move to separate file getEntityPanel
    getEntityDetailsPanel: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildDetailsQuery(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (response, meta, { entityType, projectName, projectInfo }) =>
        transformEntityData({
          projectName: projectName,
          entity: response?.data?.project && response?.data?.project[entityType],
          entityType,
          projectInfo,
        }),
      serializeQueryArgs: ({ queryArgs: { projectName, entityId, entityType } }) => ({
        projectName,
        entityId,
        entityType,
      }),
      providesTags: (res, error, { entityId, entityType }) =>
        res
          ? [
              { type: entityType, id: entityId },
              { type: entityType, id: 'LIST' },
            ]
          : [{ type: entityType, id: 'LIST' }],
    }),
    getEntitiesDetailsPanel: build.query({
      async queryFn({ entities = [], entityType, projectsInfo = {} }, { dispatch }) {
        if (!entityDetailsTypesSupported.includes(entityType))
          return { error: 'Entity type not supported' }

        try {
          const promises = entities.map((entity) =>
            dispatch(
              api.endpoints.getEntityDetailsPanel.initiate(
                {
                  projectName: entity.projectName,
                  entityId: entity.id,
                  entityType,
                  projectInfo: projectsInfo[entity.projectName],
                },
                { forceRefetch: false },
              ),
            ),
          )

          const res = await Promise.all(promises)

          const entitiesDetails = []
          for (const response of res) {
            if (response.status === 'rejected' || !response.data) {
              console.error('No entity found')
              continue
            }

            entitiesDetails.push(response.data)
          }

          return { data: entitiesDetails }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      async onCacheEntryAdded(
        { entities = [], entityType, projectsInfo },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = async (topic, message) => {
            const messageEntityId = message.summary?.entityId
            const matchedEntity = entities.find((entity) => entity.id === messageEntityId)
            // check if the message is relevant to the current query
            if (!matchedEntity) return

            try {
              // get the new data for the entity
              const res = await dispatch(
                api.endpoints.getEntityDetailsPanel.initiate(
                  {
                    projectName: matchedEntity.projectName,
                    entityId: matchedEntity.id,
                    entityType,
                    projectInfo: projectsInfo[matchedEntity.projectName],
                  },
                  { forceRefetch: true },
                ),
              )

              // check the res
              if (res.status !== 'fulfilled') {
                console.error(res?.error || 'No entity found')
                return
              }

              const updatedEntity = res.data

              updateCachedData((draft) => {
                // find the entity in the cache
                const entityIndex = draft.findIndex((entity) => entity.id === updatedEntity.id)

                if (entityIndex === -1) {
                  console.error('Entity not found in cache')
                  return
                }

                // update the entity in the cache
                draft[entityIndex] = updatedEntity
              })
            } catch (error) {
              console.error('Entity task realtime update failed', error)
              return
            }
          }

          const topic = `entity.${entityType}`
          // sub to websocket topic
          token = PubSub.subscribe(topic, handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
      serializeQueryArgs: ({ queryArgs: { entities, entityType } }) => ({
        entities,
        entityType,
      }),
      providesTags: (res, error, { entities }) =>
        entities.map(({ id }) => ({ id, type: 'entities' })),
    }),
  }),
  overrideExisting: true,
})

export const { useGetEntitiesDetailsPanelQuery, useLazyGetEntitiesDetailsPanelQuery } =
  getEntityPanel
