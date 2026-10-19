import { traitsApi } from '@shared/api/generated'
import type { ListTraitDefinitionsApiResponse } from '@shared/api/generated'
import { PubSub } from '@shared/util'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import type { TraitDefinition, TraitDefinitions } from './types'

type Definitions = DefinitionsFromApi<typeof traitsApi>
type TagTypes = TagTypesFromApi<typeof traitsApi>
type UpdatedDefinitions = Omit<Definitions, 'listTraitDefinitions'> & {
  listTraitDefinitions: OverrideResultType<Definitions['listTraitDefinitions'], TraitDefinitions>
}

const getTraitsApi = traitsApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    listTraitDefinitions: {
      transformResponse: (response: ListTraitDefinitionsApiResponse): TraitDefinitions =>
        Object.fromEntries(response.map((item) => [item.id, item as TraitDefinition])),
      providesTags: ['traitDefinitions'],
      // definitions change only with installed addons
      keepUnusedDataFor: 600,
      // addon versions in bundles can change without a server restart
      async onCacheEntryAdded(_, { dispatch, cacheDataLoaded, cacheEntryRemoved }) {
        let token
        try {
          await cacheDataLoaded

          token = PubSub.subscribe('bundle', () => {
            dispatch(getTraitsApi.util.invalidateTags(['traitDefinitions']))
          })
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`
        }
        await cacheEntryRemoved
        PubSub.unsubscribe(token)
      },
    },
  },
})

// A 404 means the server has no trait definitions endpoint (older server), treat it as no definitions
export const { useListTraitDefinitionsQuery: useGetTraitDefinitionsQuery } = getTraitsApi
export { getTraitsApi as traitsQueries }
