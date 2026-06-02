import {
  Filter,
  Option,
  SEARCH_FILTER_ID,
  getFilterFromId,
  buildFilterId,
} from '@ynput/ayon-react-components'
import type { QueryCondition, QueryFilter } from '@shared/api'

// Keys rendered as quick-action toggle buttons (stored as boolean conditions),
// not as SearchFilter chips. Activity-type toggles drive getFilterActivityTypes,
// has_attachments / in_review_session are translated by buildBackendFilter.
export const FEED_QUICK_ACTION_KEYS = [
  'comments',
  'checklists',
  'versions',
  'updates',
  'has_attachments',
  'in_review_session',
]

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => !!c && 'key' in c

// QueryFilter (feedFilter) -> Filter[] consumed by SearchFilter.
// Quick-action booleans are skipped (rendered as buttons); body becomes global
// search chips; author/category become enum chips.
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
      if (FEED_QUICK_ACTION_KEYS.includes(key)) return
      if (key === 'body') {
        const value = String(node.value ?? '')
        if (value) bodyValues.push({ id: value, label: value })
        return
      }
      const option = options.find((o) => o.id === key)
      if (!option) return
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
    filters.unshift({ id: SEARCH_FILTER_ID, label: '', values: bodyValues })
  }

  return filters
}

// Filter[] from SearchFilter -> QueryFilter, preserving the quick-action boolean
// conditions already held in the previous feedFilter.
export const clientFiltersToFeedFilter = (
  clientFilters: Filter[],
  prevFeedFilter: QueryFilter | undefined,
): QueryFilter => {
  const quickConditions = (prevFeedFilter?.conditions || []).filter(
    (c) => isCondition(c) && FEED_QUICK_ACTION_KEYS.includes(c.key) && c.value === true,
  )

  const enumConditions: QueryCondition[] = []
  const bodyConditions: QueryCondition[] = []

  clientFilters.forEach((filter) => {
    const key = getFilterFromId(filter.id)
    const values = (filter.values || []).map((v) => v.id)
    if (!values.length) return

    if (key === SEARCH_FILTER_ID) {
      values.forEach((v) => bodyConditions.push({ key: 'body', operator: 'like', value: String(v) }))
    } else {
      enumConditions.push({ key, operator: 'in', value: values.map(String) })
    }
  })

  let bodyNode: QueryCondition | QueryFilter | undefined
  if (bodyConditions.length === 1) bodyNode = bodyConditions[0]
  else if (bodyConditions.length > 1) bodyNode = { operator: 'or', conditions: bodyConditions }

  return {
    operator: 'and',
    conditions: [...quickConditions, ...enumConditions, ...(bodyNode ? [bodyNode] : [])],
  }
}
