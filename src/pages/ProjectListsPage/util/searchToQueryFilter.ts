import { SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import { QueryCondition, QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => 'key' in c

export const extractSearchFromFilters = (
  filters: QueryFilter,
): { search: string | undefined; filters: QueryFilter } => {
  if (!filters.conditions?.length) return { search: undefined, filters }

  const searchTerms: string[] = []
  const conditions = filters.conditions.filter((c) => {
    if (!isCondition(c) || c.key !== SEARCH_FILTER_ID) return true

    const terms = (Array.isArray(c.value) ? c.value : [c.value])
      .map((v) => String(v ?? '').trim())
      .filter(Boolean)
    searchTerms.push(...terms)
    return false
  })

  return {
    search: searchTerms.length ? searchTerms.join(' ') : undefined,
    filters: { ...filters, conditions },
  }
}
