import { FEATURED_VERSION_TYPES } from '@shared/components/FeaturedVersionOrder/FeaturedVersionOrderHelpers'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { extractFilters } from '@pages/VersionsProductsPage/util/getFeaturedVersionFilter'

const FEATURED_VERSION_VALUES = FEATURED_VERSION_TYPES.map((type) => type.value)

// Latest, Latest Done and Hero in the Version filter are not version numbers.
// The list items query takes them as featuredOnly, as the versions query does
// on the Products page; sent as entity_version conditions they match nothing.
export const extractFeaturedVersionFilter = (
  filters: QueryFilter,
): { filters: QueryFilter; featuredOnly?: string[] } => {
  const result = extractFilters(filters, [
    {
      // the Lists filter prefixes the version field with entity_
      filterKey: 'entity_version',
      valuesToExtract: FEATURED_VERSION_VALUES,
      resultKey: 'featuredOnly',
    },
  ])

  return {
    // extractFilters only removes conditions, so the filter keeps its type
    filters: result.filters as QueryFilter,
    featuredOnly: result.featuredOnly as string[] | undefined,
  }
}
