import { api, GetEntityWatchersApiArg } from '../watchers'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    getEntityWatchers: {},
    setEntityWatchers: {},
  },
})

type GetEntitiesWatchersApiArg = {
  entities: GetEntityWatchersApiArg[]
}

interface GetEntitiesWatchers extends GetEntityWatchersApiArg {
  watchers: string[]
}

type GetEntitiesWatchersResult = GetEntitiesWatchers[]

type SetEntitiesWatchersApiArg = {
  entities: GetEntitiesWatchers[]
}

// GET WATCHERS
const injectedApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    getEntitiesWatchers: build.query<GetEntitiesWatchersResult, GetEntitiesWatchersApiArg>({
      async queryFn({ entities = [] }, { dispatch }) {
        try {
          const entitiesWatchers = await Promise.all(
            entities.map(async (entity) => {
              const result = await dispatch(
                enhancedApi.endpoints.getEntityWatchers.initiate(entity, { forceRefetch: true }),
              )
              return {
                ...entity,
                watchers: result.data?.watchers || [],
              }
            }),
          )

          return { data: entitiesWatchers }
        } catch (error) {
          // handle errors appropriately
          console.error(error)
          throw error
        }
      },
      providesTags: (_result, _error, { entities }) =>
        entities.flatMap((entity) => [
          { type: 'watchers', id: entity.entityId },
          { type: 'watchers', id: `${entity.entityType.toUpperCase()}-LIST` },
        ]),
    }),
  }),
})

// UPDATE WATCHERS
const injectedApi2 = injectedApi.injectEndpoints({
  endpoints: (build) => ({
    setEntitiesWatchers: build.mutation<undefined, SetEntitiesWatchersApiArg>({
      async queryFn({ entities = [] }, { dispatch }) {
        const promises = entities.map((entity) =>
          dispatch(
            enhancedApi.endpoints.setEntityWatchers.initiate({
              entityId: entity.entityId,
              entityType: entity.entityType,
              projectName: entity.projectName,
              watchersModel: { watchers: entity.watchers },
            }),
          ),
        )

        try {
          await Promise.all(promises)
          return { data: undefined }
        } catch (e: any) {
          const error = { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError
          return { error }
        }
      },
      async onQueryStarted({ entities }, { dispatch, queryFulfilled, getState }) {
        const state = getState()
        const tags = entities.map((entity) => ({ type: 'watchers', id: entity.entityId }))
        // find all the affected query combinations by seeing which queries are invalidated by the tags
        const entries = enhancedApi.util.selectInvalidatedBy(state, tags)

        let patches: any[] = []

        try {
          // now update the cache for all affected queries
          entries.forEach((entry) => {
            const patch = dispatch(
              injectedApi.util.updateQueryData(
                'getEntitiesWatchers',
                entry.originalArgs,
                (draft) => {
                  entry.originalArgs.entities.forEach((entryEntity: GetEntityWatchersApiArg) => {
                    // find the entity patch
                    const entity = entities.find((e) => e.entityId === entryEntity.entityId)
                    if (!entity) return
                    // find the entity in the draft
                    const entityDraft = draft.find((e) => e.entityId === entity.entityId)
                    if (!entityDraft) throw new Error('Entity draft not found')
                    const watchersPatch = entity.watchers

                    // update draft
                    entityDraft.watchers = watchersPatch
                  })
                },
              ),
            )
            patches.push(patch)
          })

          await queryFulfilled
        } catch (error: any) {
          const message = `Error: ${error?.error?.data?.detail}` as any
          console.error(message, error)
          patches.forEach((patch) => patch?.undo())
        }
      },
      // invalidates all versions if any of the entities are tasks
      invalidatesTags: (_result, _error, { entities }) =>
        entities.some((entity) => entity.entityType === 'task')
          ? [{ type: 'watchers', id: 'VERSION-LIST' }]
          : [],
    }),
  }),
})

export { injectedApi2 as watchersApi }

export const { useGetEntitiesWatchersQuery, useSetEntitiesWatchersMutation } = injectedApi2
