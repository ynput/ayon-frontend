import { SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import { QueryCondition, QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => 'key' in c

export const extractSearchFromFilters = (
  filters: QueryFilter,
): { search: string | undefined; filters: QueryFilter } => {
  if (!filters.conditions?.length) return { search: undefined, filters }

  const searchTerms: string[] = []

  // multiple search chips become a nested OR group, so strip at any depth
  const stripSearch = (filter: QueryFilter): QueryFilter => ({
    ...filter,
    conditions: filter.conditions?.flatMap((c) => {
      if (!isCondition(c)) {
        const nested = stripSearch(c)
        return nested.conditions?.length ? [nested] : []
      }

      if (c.key !== SEARCH_FILTER_ID) return [c]

      const terms = (Array.isArray(c.value) ? c.value : [c.value])
        .map((v) => String(v ?? '').replace(/%/g, '').trim())
        .filter(Boolean)
      searchTerms.push(...terms)
      return []
    }),
  })

  const strippedFilters = stripSearch(filters)

  return {
    search: searchTerms.length ? searchTerms.join(' ') : undefined,
    filters: strippedFilters,
  }
}
