import {
  Filter,
  Option,
  SEARCH_FILTER_ID,
  getFilterFromId,
  buildFilterId,
} from '@ynput/ayon-react-components'
import type { QueryCondition, QueryFilter } from '@shared/api'
import { tryMergeDatetimeRange } from '@shared/containers/ProjectTreeTable/utils/queryFilterToClientFilter'
import { convertDateFilterToQueryFilter } from '@shared/containers/ProjectTreeTable/utils/clientFilterToQueryFilter'

export const SUBTASKS_BOOLEAN_KEYS = ['done', 'isDone']

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => !!c && 'key' in c

// QueryFilter -> Filter[] for SearchFilter.
// search conditions -> global-search chips, done -> boolean chips, assignees -> enum chips.
export const subtasksFilterToClientFilters = (
  queryFilter: QueryFilter | undefined,
  options: Option[],
): Filter[] => {
  const filters: Filter[] = []
  const searchValues: { id: string; label: string }[] = []

  const walk = (node: QueryCondition | QueryFilter) => {
    if (!node) return
    if (isCondition(node)) {
      const key = node.key
      if (key === 'search') {
        const value = String(node.value ?? '')
        if (value) searchValues.push({ id: value, label: value })
        return
      }
      const option = options.find((o) => o.id === key)
      if (!option) return

      if (SUBTASKS_BOOLEAN_KEYS.includes(key)) {
        if (node.value !== undefined) {
          filters.push({
            id: buildFilterId(key),
            label: option.label,
            icon: option.icon,
            type: 'boolean',
            singleSelect: true,
            values: [{ id: String(node.value), label: node.value ? 'Done' : 'Not Done' }],
          })
        }
        return
      }

      if (option.type === 'datetime') {
        const value = Array.isArray(node.value) ? node.value[0] : node.value
        filters.push({
          id: buildFilterId(key),
          label: option.label,
          type: 'datetime',
          icon: option.icon,
          values: [
            {
              id: String(value),
              label: String(value),
              // @ts-expect-error - values is okay
              values: [{ id: String(value) }],
            },
          ],
        })
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

    const dateFilter = tryMergeDatetimeRange(node as any, options as any)
    if (dateFilter) {
      filters.push(dateFilter)
      return
    }

    node.conditions?.forEach(walk)
  }

  queryFilter?.conditions?.forEach(walk)

  if (searchValues.length) {
    filters.push({ id: SEARCH_FILTER_ID, label: '', values: searchValues })
  }

  return filters
}

// Filter[] from SearchFilter -> QueryFilter.
export const clientFiltersToSubtasksFilter = (clientFilters: Filter[]): QueryFilter => {
  const conditions: (QueryCondition | QueryFilter)[] = []
  const searchConditions: QueryCondition[] = []

  clientFilters.forEach((filter) => {
    const key = getFilterFromId(filter.id)
    const values = (filter.values || []).map((v) => v.id)
    if (!values.length) return

    if (key === SEARCH_FILTER_ID) {
      values.forEach((v) =>
        searchConditions.push({ key: 'search', operator: 'like', value: String(v) }),
      )
    } else if (SUBTASKS_BOOLEAN_KEYS.includes(key)) {
      const val = values[0] === 'true'
      conditions.push({ key, operator: 'eq', value: val })
    } else if (filter.type === 'datetime') {
      const dateQueryFilter = convertDateFilterToQueryFilter(key, filter)
      if (dateQueryFilter) {
        conditions.push(dateQueryFilter as QueryFilter)
      }
    } else {
      conditions.push({ key, operator: 'in', value: values.map(String) })
    }
  })

  if (searchConditions.length === 1) conditions.push(searchConditions[0])
  else if (searchConditions.length > 1)
    conditions.push({ operator: 'or', conditions: searchConditions })

  return { operator: 'and', conditions }
}
