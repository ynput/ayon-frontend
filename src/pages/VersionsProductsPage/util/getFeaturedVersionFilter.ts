import { QueryFilter, QueryCondition } from '@shared/api'
import { FEATURED_VERSION_TYPES } from '@shared/components'

// Get featured version values for quick lookup
const FEATURED_VERSION_VALUES = FEATURED_VERSION_TYPES.map((type) => type.value)

type ExtractConfig = {
  /** The filter key to extract (e.g., 'version', 'hasReviewables') */
  filterKey: string
  /** Optional: specific values to extract. If not provided, extracts all values */
  valuesToExtract?: string[]
  /** Optional: custom name for the extracted result key. Defaults to filterKey + 'Filter' */
  resultKey?: string
  /** Optional: if true, converts the extracted string array to a boolean value */
  isBooleanFilter?: boolean
}

type ExtractedFilters = {
  filters: QueryFilter
  [key: string]: QueryFilter | string[] | boolean | undefined
}

export const extractFilters = (
  filters: QueryFilter,
  extractConfigs: ExtractConfig[],
): ExtractedFilters => {
  // Helper to convert extracted string array to boolean value
  const convertToBoolean = (values: string[]): boolean | undefined => {
    if (values.includes('true')) return true
    if (values.includes('false')) return false
    return undefined
  }

  // Initialize result object with extracted values storage
  const extractedValues: Record<string, string[] | boolean | undefined> = {}
  extractConfigs.forEach((config) => {
    const key = config.resultKey || `${config.filterKey}Filter`
    extractedValues[key] = []
  })

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

        // Check if this condition matches any extract config
        for (const config of extractConfigs) {
          if (cleanKey === config.filterKey && queryCondition.value !== undefined) {
            const resultKey = config.resultKey || `${config.filterKey}Filter`
            const values = Array.isArray(queryCondition.value)
              ? queryCondition.value
              : [queryCondition.value]

            let valuesToExtract: any[]
            let remainingValues: any[]

            if (config.valuesToExtract) {
              // Extract only specific values
              valuesToExtract = values.filter((v: any) =>
                config.valuesToExtract!.includes(String(v)),
              )
              remainingValues = values.filter(
                (v: any) => !config.valuesToExtract!.includes(String(v)),
              )
            } else {
              // Extract all values
              valuesToExtract = values
              remainingValues = []
            }

            // If we found values to extract, add them
            if (valuesToExtract.length > 0) {
              const extractedStrings = valuesToExtract.map((v: any) => String(v))

              // Convert to boolean if this is a boolean filter
              if (config.isBooleanFilter) {
                extractedValues[resultKey] = convertToBoolean(extractedStrings)
              } else {
                ;(extractedValues[resultKey] as string[]).push(...extractedStrings)
              }

              // If there are no remaining values, return undefined to signal removal
              if (remainingValues.length === 0) {
                return undefined
              }

              // Return condition with remaining values only
              return {
                ...queryCondition,
                value: remainingValues.length === 1 ? remainingValues[0] : remainingValues,
              }
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

  // Build result object
  const result: ExtractedFilters = {
    filters: processedFilter,
  }

  // Add extracted values to result (only if they exist)
  Object.entries(extractedValues).forEach(([key, values]) => {
    if (typeof values === 'boolean') {
      result[key] = values
    } else if (Array.isArray(values) && values.length > 0) {
      result[key] = values
    } else {
      result[key] = undefined
    }
  })

  return result
}

/**
 * Legacy function - extracts featured version filter values from a version filter.
 * Use extractFilters for more flexibility.
 *
 * @deprecated Use extractFilters instead
 */
export const getFeaturedVersionFilter = (filters: QueryFilter) => {
  const result = extractFilters(filters, [
    {
      filterKey: 'version',
      valuesToExtract: FEATURED_VERSION_VALUES,
      resultKey: 'featuredVersionFilter',
    },
  ])

  return {
    filters: result.filters,
    featuredVersionFilter: result.featuredVersionFilter as string[] | undefined,
  }
}
