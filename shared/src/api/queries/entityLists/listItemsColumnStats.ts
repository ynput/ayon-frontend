import { gqlApi } from '@shared/api/generated'
import type { GetListItemsColumnStatsQuery } from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import type { FieldStats, MetricTarget } from '../columnStats'
import { normalizeFieldStats, mergeFieldStats, hasNewTargetFields } from '../columnStats'

// The list items query aliases entity columns `_entity_{col}` and merges
// entity+item attribs into `_all_attrib`, so canonical target fields must be
// translated out and stat column names translated back (ayon-backend#943).
const toBackendField = (field: string): string => {
  if (field.startsWith('attrib.')) {
    return `_all_attrib.${field.slice('attrib.'.length)}`
  }
  if (field.startsWith('inherited_attributes.')) {
    return `_all_attrib.${field.slice('inherited_attributes.'.length)}`
  }
  return `_entity_${field}`
}

const toCanonicalColumn = (name: string): string => {
  if (name.startsWith('_all_attrib_')) return `attrib_${name.slice('_all_attrib_'.length)}`
  if (name.startsWith('_entity_')) return name.slice('_entity_'.length)
  return name
}

export const toListItemsStatsTargets = (targets: MetricTarget[]): MetricTarget[] =>
  targets.map((t) => ({ ...t, field: toBackendField(t.field) }))

type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
type UpdatedDefinitions = Definitions & {
  GetListItemsColumnStats: OverrideResultType<Definitions['GetListItemsColumnStats'], FieldStats[]>
}

const listItemsColumnStatsApi = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    // same caching as the other column stats endpoints: `targets` excluded
    // from the cache key, responses merged, only added targets refetch
    GetListItemsColumnStats: {
      transformResponse: (res: GetListItemsColumnStatsQuery) => {
        const stats = res?.project?.entityLists?.edges?.[0]?.node?.items?.fieldStats ?? []
        return normalizeFieldStats(
          stats.map((s) => ({ ...s, columnName: toCanonicalColumn(s.columnName) })),
        )
      },
      serializeQueryArgs: ({ queryArgs: { targets: _t, ...rest } }) => rest,
      merge: (cache, incoming) => mergeFieldStats(incoming, cache),
      forceRefetch: ({ currentArg, previousArg }) => hasNewTargetFields(currentArg, previousArg),
      providesTags: (_r, _e, { listId, projectName }) => [
        { type: 'entityListItemsColumnStats', id: listId },
        { type: 'entityListItemsColumnStats', id: projectName },
      ],
    },
  },
})

export const { useGetListItemsColumnStatsQuery } = listItemsColumnStatsApi
