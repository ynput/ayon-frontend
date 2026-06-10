import { gqlApi } from '@shared/api/generated'
import type { FieldStats } from '@shared/api'
import { normalizeFieldStats, mergeFieldStats, hasNewTargetFields } from '../columnStats'
import type { MetricTarget } from '@shared/api'

// Hand-written document: the `calculateSpecificStatistics` arg and `fieldStats`
// field on entity list items are not in the introspected schema yet
// (ayon-backend#943). Once that PR merges, move this query to
// gql/GetListItemsColumnStats.graphql and regenerate.
const GET_LIST_ITEMS_COLUMN_STATS = `
  query GetListItemsColumnStats(
    $projectName: String!
    $listId: String!
    $filter: String
    $targets: [MetricTargetInput!]
  ) {
    project(name: $projectName) {
      name
      entityLists(ids: [$listId]) {
        edges {
          node {
            id
            items(filter: $filter, calculateSpecificStatistics: $targets) {
              fieldStats {
                columnName
                min
                max
                avg
                sum
                count
                valueFilledCount
                percentageFilled
                valueNotFilledCount
                percentageNotFilled
                checkedCount
                checkedPercentage
                notCheckedCount
                notCheckedPercentage
                distribution
              }
            }
          }
        }
      }
    }
  }
`

export type GetListItemsColumnStatsVariables = {
  projectName: string
  listId: string
  filter?: string
  targets?: MetricTarget[]
}

type GetListItemsColumnStatsResponse = {
  project?: {
    entityLists?: {
      edges?: { node?: { items?: { fieldStats?: FieldStats[] } } }[]
    }
  }
}

// The list items query aliases entity columns `_entity_{col}` and merges
// entity+item attribs into `_all_attrib`, so canonical target fields must be
// translated out and stat column names translated back (ayon-backend#943).
const toBackendField = (field: string): string =>
  field.startsWith('attrib.')
    ? `_all_attrib.${field.slice('attrib.'.length)}`
    : `_entity_${field}`

const toCanonicalColumn = (name: string): string => {
  if (name.startsWith('_all_attrib_')) return `attrib_${name.slice('_all_attrib_'.length)}`
  if (name.startsWith('_entity_')) return name.slice('_entity_'.length)
  return name
}

const listItemsColumnStatsApi = gqlApi.injectEndpoints({
  endpoints: (build) => ({
    GetListItemsColumnStats: build.query<FieldStats[], GetListItemsColumnStatsVariables>({
      query: ({ targets, ...variables }) => ({
        document: GET_LIST_ITEMS_COLUMN_STATS,
        variables: {
          ...variables,
          targets: targets?.map((t) => ({ ...t, field: toBackendField(t.field) })),
        },
      }),
      transformResponse: (res: GetListItemsColumnStatsResponse) => {
        const stats = res?.project?.entityLists?.edges?.[0]?.node?.items?.fieldStats ?? []
        return normalizeFieldStats(
          stats.map((s) => ({ ...s, columnName: toCanonicalColumn(s.columnName) })),
        )
      },
      // same caching as the other column stats endpoints: `targets` excluded
      // from the cache key, responses merged, only added targets refetch
      serializeQueryArgs: ({ queryArgs: { targets: _t, ...rest } }) => rest,
      merge: (cache, incoming) => mergeFieldStats(incoming, cache),
      forceRefetch: ({ currentArg, previousArg }) => hasNewTargetFields(currentArg, previousArg),
      providesTags: (_r, _e, { listId, projectName }) => [
        { type: 'entityListItemsColumnStats', id: listId },
        { type: 'entityListItemsColumnStats', id: projectName },
      ],
    }),
  }),
})

export const { useGetListItemsColumnStatsQuery } = listItemsColumnStatsApi
