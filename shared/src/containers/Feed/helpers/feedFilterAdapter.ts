import {
  Filter,
  Option,
  SEARCH_FILTER_ID,
  getFilterFromId,
  buildFilterId,
} from '@ynput/ayon-react-components'
import type { QueryCondition, QueryFilter } from '@shared/api'

// On/off filters stored as boolean conditions ({ key, eq, true }). Activity-type
// keys drive getFilterActivityTypes; has_attachments / in_review_session are
// translated by buildBackendFilter. All shown as dropdown chips.
export const FEED_BOOLEAN_KEYS = [
  'comments',
  'versions',
  'updates',
  'checklists',
  'has_attachments',
  'in_review_session',
]

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => !!c && 'key' in c

// QueryFilter (feedFilter) -> Filter[] for SearchFilter.
// body -> global-search chips, boolean keys -> single-value "Yes" chips,
// author/category -> enum chips.
export const feedFilterToClientFilters = (
  feedFilter: QueryFilter | undefined,
  options: Option[],
): Filter[] => {
  const filters: Filter[] = []
  const bodyValues: { id: string; label: string }[] = []

  const walk = (node: QueryCondition | QueryFilter) => {
    if (!node) return
    if (isCondition(node)) {
      const key = node.key
      if (key === 'body') {
        const value = String(node.value ?? '')
        if (value) bodyValues.push({ id: value, label: value })
        return
      }
      const option = options.find((o) => o.id === key)
      if (!option) return

      if (FEED_BOOLEAN_KEYS.includes(key)) {
        if (node.value === true) {
          filters.push({
            id: buildFilterId(key),
            label: option.label,
            icon: option.icon,
            type: 'boolean',
            singleSelect: true,
            values: [{ id: 'true', label: 'Yes' }],
          })
        }
        return
      }

      const rawValues = Array.isArray(node.value) ? node.value : [node.value]
      filters.push({
        id: buildFilterId(key),
        label: option.label,
        type: option.type,
        icon: option.icon,
        operator: 'OR',
        values: rawValues.map((val) => {
          const match = option.values?.find((o) => o.id === String(val))
          return match ? { ...match } : { id: String(val), label: String(val) }
        }),
      })
      return
    }
    node.conditions?.forEach(walk)
  }

  feedFilter?.conditions?.forEach(walk)

  if (bodyValues.length) {
    filters.push({ id: SEARCH_FILTER_ID, label: '', values: bodyValues })
  }

  return filters
}

// Filter[] from SearchFilter -> QueryFilter (feedFilter UI representation).
export const clientFiltersToFeedFilter = (clientFilters: Filter[]): QueryFilter => {
  const conditions: (QueryCondition | QueryFilter)[] = []
  const bodyConditions: QueryCondition[] = []

  clientFilters.forEach((filter) => {
    const key = getFilterFromId(filter.id)
    const values = (filter.values || []).map((v) => v.id)
    if (!values.length) return

    if (key === SEARCH_FILTER_ID) {
      values.forEach((v) => bodyConditions.push({ key: 'body', operator: 'like', value: String(v) }))
    } else if (FEED_BOOLEAN_KEYS.includes(key)) {
      if (values.includes('true')) conditions.push({ key, operator: 'eq', value: true })
    } else {
      conditions.push({ key, operator: 'in', value: values.map(String) })
    }
  })

  if (bodyConditions.length === 1) conditions.push(bodyConditions[0])
  else if (bodyConditions.length > 1) conditions.push({ operator: 'or', conditions: bodyConditions })

  return { operator: 'and', conditions }
}
