import { QueryFilter, QueryCondition } from '@shared/api'
import { FEATURED_VERSION_TYPES } from '@shared/components'

// extracts any version filter with special handling for featured versions (hero, latest, latest done)

const VERSION_FILTER_ID = 'version'

// Get featured version values for quick lookup
const FEATURED_VERSION_VALUES = FEATURED_VERSION_TYPES.map((type) => type.value)

type Return = {
  filters: QueryFilter
  featuredVersionFilter: string[] | undefined
}

/**
 * Extracts featured version filter values from a version filter.
 * Removes any FEATURED_VERSION_TYPE values from version filters and returns them separately.
 * Handles scope prefixes on filter keys (e.g., 'version_version' -> 'version').
 */
export const getFeaturedVersionFilter = (filters: QueryFilter): Return => {
  let featuredVersions: string[] = []
  let hasChanges = false

  // Helper to remove scope prefix from a filter key
  const removeScopePrefix = (key: string): string => {
    // Remove scope prefixes like "version_", "product_", "task_", "folder_", "user_"
    return key.replace(/^(version|product|task|folder|user)_/, '')
  }

  // Helper to process conditions recursively
  const processConditions = (
    conditions: (QueryCondition | QueryFilter)[],
  ): (QueryCondition | QueryFilter)[] => {
    return conditions
      .map((condition) => {
        // Check if it's a nested QueryFilter
        if ('conditions' in condition && !('key' in condition)) {
          const nestedProcessed = processConditions(condition.conditions || [])
          return {
            ...condition,
            conditions: nestedProcessed,
          }
        }

        // It's a QueryCondition
        const queryCondition = condition as QueryCondition
        const cleanKey = removeScopePrefix(queryCondition.key)

        // Check if this is a version filter
        if (cleanKey === VERSION_FILTER_ID && queryCondition.value) {
          const values = Array.isArray(queryCondition.value)
            ? queryCondition.value
            : [queryCondition.value]
          const featuredValues = values.filter((v: any) =>
            FEATURED_VERSION_VALUES.includes(String(v)),
          )
          const nonFeaturedValues = values.filter(
            (v: any) => !FEATURED_VERSION_VALUES.includes(String(v)),
          )

          // If we found featured values, extract them
          if (featuredValues.length > 0) {
            featuredVersions.push(...featuredValues.map((v: any) => String(v)))
            hasChanges = true

            // If there are no non-featured values, return undefined to signal removal
            if (nonFeaturedValues.length === 0) {
              return undefined
            }

            // Return condition with non-featured values only
            return {
              ...queryCondition,
              value: nonFeaturedValues.length === 1 ? nonFeaturedValues[0] : nonFeaturedValues,
            }
          }
        }

        return condition
      })
      .filter((condition): condition is QueryCondition | QueryFilter => condition !== undefined)
  }

  // Process the filter
  let processedFilter: QueryFilter = filters

  if (filters?.conditions && filters.conditions.length > 0) {
    const processedConditions = processConditions(filters.conditions)
    processedFilter = {
      ...filters,
      conditions: processedConditions,
    }
  }

  return {
    filters: processedFilter,
    featuredVersionFilter: featuredVersions.length > 0 ? featuredVersions : undefined,
  }
}
