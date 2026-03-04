import { groupingApi } from '@shared/api/generated'
import { PubSub } from '@shared/util'

const enhancedGroupingApi = groupingApi.enhanceEndpoints({
  endpoints: {
    getEntityGroups: {
      // Subscribe to entity changes to refresh group counts
      onCacheEntryAdded: async (arg, { cacheDataLoaded, cacheEntryRemoved, dispatch }) => {
        await cacheDataLoaded

        // Map entityType to PubSub topic (handle plural forms)
        const entityType = arg.entityType.replace(/s$/, '') // 'versions' -> 'version'
        const topic = `entity.${entityType}`

        const token = PubSub.subscribe(topic, () => {
          // Refetch groups when any entity of this type changes
          dispatch(
            enhancedGroupingApi.endpoints.getEntityGroups.initiate(arg, { forceRefetch: true }),
          )
        })

        await cacheEntryRemoved
        PubSub.unsubscribe(token)
      },
    },
  },
})

export const { useGetEntityGroupsQuery } = enhancedGroupingApi
export { enhancedGroupingApi as groupingQueries }