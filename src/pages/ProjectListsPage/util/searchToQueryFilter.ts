import { SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import { QueryCondition, QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

// entity_list_items has no fuzzy `search` arg (ayon-backend#1008), so the global
// search chip is translated into ILIKE conditions on name/label/path client-side
const SEARCH_KEYS_BY_TYPE: Record<string, string[]> = {
  folder: ['label', 'folderPath', 'entity_name', 'entity_label'],
  task: ['label', 'folderPath', 'entity_name', 'entity_label'],
  product: ['label', 'folderPath', 'entity_name'],
  version: ['label', 'folderPath'],
}
const DEFAULT_SEARCH_KEYS = ['label', 'folderPath']

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => 'key' in c

export const convertSearchToQueryFilter = (
  filters: QueryFilter,
  entityType?: string,
): QueryFilter => {
  if (!filters.conditions?.length) return filters

  const keys = SEARCH_KEYS_BY_TYPE[entityType || ''] || DEFAULT_SEARCH_KEYS

  const conditions = filters.conditions
    .map((c) => {
      if (!isCondition(c) || c.key !== SEARCH_FILTER_ID) return c

      const terms = (Array.isArray(c.value) ? c.value : [c.value])
        .map((v) => String(v ?? '').trim())
        .filter(Boolean)
      if (!terms.length) return null

      const searchGroup: QueryFilter = {
        operator: 'or',
        conditions: terms.flatMap((term) =>
          keys.map((key): QueryCondition => ({ key, operator: 'like', value: `%${term}%` })),
        ),
      }
      return searchGroup
    })
    .filter((c): c is QueryCondition | QueryFilter => c !== null)

  return { ...filters, conditions }
}
