import { gqlApi } from '@shared/api/generated'
import type {
  GetDetailsPanelFolderQuery,
  GetDetailsPanelRepresentationQuery,
  GetDetailsPanelTaskQuery,
  GetDetailsPanelVersionQuery,
} from '@shared/api/generated'
import {
  createRealtimeBatcher,
  getSupportedEntityPatch,
  PubSub,
  REALTIME_REST_CALL_LIMIT,
  REALTIME_TASK_SUPPORTED_VALUE_FIELDS,
  RealtimeBatchProcessor,
  subscribeToThumbnailUpdates,
  SupportedTaskField,
  ThumbnailUpdateMessage,
  waitForRealtimeJitter,
} from '@shared/util'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  detailsPanelEntityTypes,
  transformDetailsPanelQueriesData,
} from './transformDetailsPanelData'
import type { DetailsPanelEntityData, DetailsPanelEntityType } from './transformDetailsPanelData'

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
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

const enhancedDetailsApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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

const detailsPanelQueries2 = enhancedDetailsApi.injectEndpoints({
  endpoints: (build) => ({
    getEntitiesDetailsPanel: build.query<DetailsPanelEntityData[], GetEntitiesDetailsPanelArgs>({
      async queryFn({ entities = [], entityType }, { dispatch }) {
        if (!detailsPanelEntityTypes.includes(entityType)) {
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
        { entityType },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        let unsubscribeThumbnails: (() => void) | undefined
        const batchProcessMessages: RealtimeBatchProcessor<{
          topic: string
          message: any
        }> = async (updates, isActive) => {
          const cachedEntities = getCacheEntry().data ?? []
          const cachedEntityKeys = new Set(
            cachedEntities.map((entity) => `${entity.projectName}:${entity.id}`),
          )
          const entitiesToFetch = new Map<string, { id: string; projectName: string }>()
          const patches: {
            id: string
            projectName: string
            field: SupportedTaskField
            value: string | string[]
          }[] = []

          updates.forEach(({ topic, message }) => {
            const entityId = message.summary?.entityId
            const projectName = message.project
            if (!entityId || !projectName) return

            const entityKey = `${projectName}:${entityId}`
            // Only refresh entities that are currently displayed in this panel.
            if (!cachedEntityKeys.has(entityKey)) return

            const field = topic.split('.')[2]?.replace('_changed', '')
            const patch = getSupportedEntityPatch(
              field,
              message.summary,
              REALTIME_TASK_SUPPORTED_VALUE_FIELDS,
            )
            if (patch) {
              patches.push({
                id: entityId,
                projectName,
                field: patch.field as SupportedTaskField,
                value: patch.value,
              })
            } else {
              entitiesToFetch.set(entityKey, { id: entityId, projectName })
            }
          })

          if (patches.length) {
            updateCachedData((draft) => {
              patches.forEach(({ id, projectName, field, value }) => {
                const entity = draft.find(
                  (item) => item.id === id && item.projectName === projectName,
                )
                if (!entity) return

                Object.assign(entity, {
                  ...(field === 'status' || field === 'tags' ? { [field]: value } : {}),
                  ...(field === 'type' ? { entitySubType: value } : {}),
                })

                if (field === 'assignees' && entity.task) {
                  entity.task.assignees = value as string[]
                }
                if (field === 'type' && entity.task) {
                  entity.task.taskType = value as string
                }
              })
            })
          }

          const entitiesToRefresh = Array.from(entitiesToFetch.values())
          if (!entitiesToRefresh.length || entitiesToRefresh.length > REALTIME_REST_CALL_LIMIT) {
            return
          }

          // Avoid sending a burst of requests immediately after a realtime event.
          await waitForRealtimeJitter()
          const updatedEntities = await Promise.all(
            entitiesToRefresh.map(async (entity) => {
              try {
                // Get the new data for the entity.
                const res = await dispatch(
                  enhancedDetailsApi.endpoints[getEntityTypeQueryName(entityType)].initiate(
                    {
                      projectName: entity.projectName,
                      entityId: entity.id,
                    },
                    { forceRefetch: true },
                  ),
                )

                // Check the response.
                if (res.status !== 'fulfilled') {
                  console.error(res?.error || 'No entity found')
                  return null
                }

                const updatedEntity = res.data
                if (!updatedEntity) {
                  console.error('No entity found')
                  return null
                }

                return updatedEntity
              } catch (error) {
                console.error('Entity task realtime update failed', error)
                return null
              }
            }),
          )
          if (!isActive()) return

          updateCachedData((draft) => {
            updatedEntities.forEach((updatedEntity) => {
              if (!updatedEntity) return

              // Find the entity in the cache.
              const entityIndex = draft.findIndex(
                (entity) =>
                  entity.id === updatedEntity.id &&
                  entity.projectName === updatedEntity.projectName,
              )

              if (entityIndex === -1) {
                console.error('Entity not found in cache')
                return
              }

              // Update the entity in the cache.
              draft[entityIndex] = updatedEntity
            })
          })
        }
        const batcher = createRealtimeBatcher(
          batchProcessMessages,
          ({ topic, message }) => `${message.project}:${message.summary?.entityId}:${topic}`,
        )

        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              const cachedEntities = getCacheEntry().data ?? []
              const matchedMessages = messages.filter((m) =>
                cachedEntities.some(
                  (entity) => entity.id === m.summary.entityId && entity.projectName === m.project,
                ),
              )
              if (matchedMessages.length === 0) return

              updateCachedData((draft) => {
                matchedMessages.forEach((message) => {
                  const entityIndex = draft.findIndex(
                    (entity) => entity.id === message.summary.entityId,
                  )
                  if (entityIndex !== -1 && draft[entityIndex] && message.summary.thumbnailHash) {
                    draft[entityIndex].thumbnailHash = message.summary.thumbnailHash
                  }
                })
              })
            },
            [entityType],
          )

          const handlePubSub = (_topic: string, message: any) => {
            if (!message?.project || !message?.summary?.entityId) return
            batcher.add({ topic: _topic, message })
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
        if (unsubscribeThumbnails) {
          unsubscribeThumbnails()
        }
        batcher.clear()
      },
      providesTags: (_res, _error, { entities, entityType }) => [
        ...entities.map(({ id }: { id: string }) => ({ id, type: 'entities' })),
        { type: 'entities', id: entityType.toUpperCase() },
        { type: 'entities', id: 'LIST' },
      ],
    }),
  }),
})

export const { useGetEntitiesDetailsPanelQuery, useLazyGetEntitiesDetailsPanelQuery } =
  detailsPanelQueries2
export { detailsPanelQueries2 as detailsPanelQueries }
