import { FEATURED_VERSION_TYPES } from '@shared/components/FeaturedVersionOrder/FeaturedVersionOrderHelpers'
import { QueryCondition, QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { extractFilters } from '@pages/VersionsProductsPage/util/getFeaturedVersionFilter'

// the Lists filter prefixes the version field with entity_
const VERSION_KEY = 'entity_version'
const FEATURED_VERSION_VALUES = FEATURED_VERSION_TYPES.map((type) => type.value)
const isFeatured = (value: unknown) => FEATURED_VERSION_VALUES.includes(String(value))

// The server can keep only the featured versions, not leave them out, so an excluded
// Latest, Latest Done or Hero can't be applied. The Lists filter doesn't offer to exclude
// versions; a saved view that does keeps filtering nothing by it, as before featuredOnly.
const dropExcludedFeatured = (filter: QueryFilter): QueryFilter => ({
  ...filter,
  conditions: filter.conditions?.flatMap((condition): (QueryCondition | QueryFilter)[] => {
    if (!('key' in condition)) return [dropExcludedFeatured(condition)]
    const { key, operator = 'eq', value } = condition
    if (key !== VERSION_KEY || operator === 'in' || operator === 'eq') return [condition]
    if (!Array.isArray(value)) return isFeatured(value) ? [] : [condition]
    const versions = (value as (string | number)[]).filter((v) => !isFeatured(v))
    return versions.length ? [{ ...condition, value: versions as string[] }] : []
  }),
})

// Latest, Latest Done and Hero in the Version filter are not version numbers.
// The list items query takes them as featuredOnly, as the versions query does
// on the Products page; sent as entity_version conditions they match nothing.
export const extractFeaturedVersionFilter = (
  filters: QueryFilter,
): { filters: QueryFilter; featuredOnly?: string[] } => {
  const result = extractFilters(dropExcludedFeatured(filters), [
    { filterKey: VERSION_KEY, valuesToExtract: FEATURED_VERSION_VALUES, resultKey: 'featuredOnly' },
  ])

  return {
    // extractFilters only removes conditions, so the filter keeps its type
    filters: result.filters as QueryFilter,
    featuredOnly: result.featuredOnly as string[] | undefined,
  }
}

// The Lists page passes its filter around as one JSON string (deep links, the compare
// view); every list items request splits it into the query's filter and featuredOnly.
export const splitFeaturedVersionFilter = (
  filter?: string,
): { filter?: string; featuredOnly?: string[] } => {
  if (!filter) return {}
  const { filters, featuredOnly } = extractFeaturedVersionFilter(JSON.parse(filter))
  return { filter: filters.conditions?.length ? JSON.stringify(filters) : undefined, featuredOnly }
}
