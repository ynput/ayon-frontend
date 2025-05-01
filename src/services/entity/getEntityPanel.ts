import api, {
  GetDetailsPanelFolderQuery,
  GetDetailsPanelRepresentationQuery,
  GetDetailsPanelTaskQuery,
  GetDetailsPanelVersionQuery,
} from '@shared/client'
import { entityDetailsTypesSupported } from '../userDashboard/userDashboardQueries'
import PubSub from '@/pubsub'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  DetailsPanelEntityData,
  DetailsPanelEntityType,
  transformDetailsPanelQueriesData,
} from './transformDetailsPanelData'

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<
  Definitions,
  | 'GetDetailsPanelFolder'
  | 'GetDetailsPanelTask'
  | 'GetDetailsPanelVersion'
  | 'GetDetailsPanelRepresentation'
> & {
  GetDetailsPanelFolder: OverrideResultType<
    Definitions['GetDetailsPanelFolder'],
    DetailsPanelEntityData | null
  >
  GetDetailsPanelTask: OverrideResultType<
    Definitions['GetDetailsPanelTask'],
    DetailsPanelEntityData | null
  >
  GetDetailsPanelVersion: OverrideResultType<
    Definitions['GetDetailsPanelVersion'],
    DetailsPanelEntityData | null
  >
  GetDetailsPanelRepresentation: OverrideResultType<
    Definitions['GetDetailsPanelRepresentation'],
    DetailsPanelEntityData | null
  >
}

const enhancedDetailsApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetDetailsPanelFolder: {
      transformResponse: (response: GetDetailsPanelFolderQuery, _meta, args) => {
        const { projectName } = args
        const entity = response?.project?.folder
        if (!entity) return null
        return transformDetailsPanelQueriesData({
          projectName,
          entity,
          entityType: 'folder',
        })
      },
    },
    GetDetailsPanelTask: {
      transformResponse: (response: GetDetailsPanelTaskQuery, _meta, args) => {
        const { projectName } = args
        const entity = response?.project?.task
        if (!entity) return null
        return transformDetailsPanelQueriesData({
          projectName,
          entity,
          entityType: 'task',
        })
      },
    },
    GetDetailsPanelVersion: {
      transformResponse: (response: GetDetailsPanelVersionQuery, _meta, args) => {
        const { projectName } = args
        const entity = response?.project?.version
        if (!entity) return null
        return transformDetailsPanelQueriesData({
          projectName,
          entity,
          entityType: 'version',
        })
      },
    },
    GetDetailsPanelRepresentation: {
      transformResponse: (response: GetDetailsPanelRepresentationQuery, _meta, args) => {
        const { projectName } = args
        const entity = response?.project?.representation
        if (!entity) return null
        return transformDetailsPanelQueriesData({
          projectName,
          entity,
          entityType: 'representation',
        })
      },
    },
  },
})

type GetEntitiesDetailsPanelArgs = {
  entities: { id: string; projectName: string }[]
  entityType: DetailsPanelEntityType
  projectsInfo: Record<string, any>
}

type QueryNameType =
  | 'GetDetailsPanelTask'
  | 'GetDetailsPanelVersion'
  | 'GetDetailsPanelFolder'
  | 'GetDetailsPanelRepresentation'

const getEntityTypeQueryName = (entityType: DetailsPanelEntityType): QueryNameType => {
  switch (entityType) {
    case 'task':
      return 'GetDetailsPanelTask'

    case 'version':
      return 'GetDetailsPanelVersion'

    case 'folder':
      return 'GetDetailsPanelFolder'

    case 'representation':
      return 'GetDetailsPanelRepresentation'
  }
}

const getEntityPanelApi2 = enhancedDetailsApi.injectEndpoints({
  endpoints: (build) => ({
    getEntitiesDetailsPanel: build.query<DetailsPanelEntityData[], GetEntitiesDetailsPanelArgs>({
      async queryFn({ entities = [], entityType }, { dispatch }) {
        if (!entityDetailsTypesSupported.includes(entityType)) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Entity type not supported',
            } as FetchBaseQueryError,
          }
        }

        try {
          const promises = entities.map((entity) => {
            return dispatch(
              enhancedDetailsApi.endpoints[getEntityTypeQueryName(entityType)].initiate(
                {
                  projectName: entity.projectName,
                  entityId: entity.id,
                },
                { forceRefetch: true },
              ),
            )
          })

          const res = await Promise.all(promises)

          const entitiesData = res
            .filter((res) => !!res.data)
            .map((res) => res.data) as DetailsPanelEntityData[]

          return { data: entitiesData }
        } catch (e: any) {
          console.error(e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      async onCacheEntryAdded(
        { entities, entityType },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = async (_topic: string, message: any) => {
            const messageEntityId = message.summary?.entityId
            const matchedEntity = entities.find((entity) => entity.id === messageEntityId)
            // check if the message is relevant to the current query
            if (!matchedEntity) return

            try {
              // get the new data for the entity
              const res = await dispatch(
                enhancedDetailsApi.endpoints[getEntityTypeQueryName(entityType)].initiate(
                  {
                    projectName: matchedEntity.projectName,
                    entityId: matchedEntity.id,
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

              if (!updatedEntity) {
                console.error('No entity found')
                return
              }

              updateCachedData((draft) => {
                // find the entity in the cache
                const entityIndex = draft.findIndex((entity: any) => entity.id === updatedEntity.id)

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
      providesTags: (_res, _error, { entities }) =>
        entities.map(({ id }: { id: string }) => ({ id, type: 'entities' })),
    }),
  }),
})

export const { useGetEntitiesDetailsPanelQuery, useLazyGetEntitiesDetailsPanelQuery } =
  getEntityPanelApi2
export { getEntityPanelApi2 as getEntityPanelApi }
