import { Filter, FilterValue } from '@ynput/ayon-react-components'
import { QueryFilter, QueryCondition } from '../types/operations'

// Option interface for filter options (from useBuildFilterOptions)
interface Option {
  id: string
  type?: string
  label: string
  icon?: string | null
  img?: string | null
  inverted?: boolean
  operator?: 'AND' | 'OR'
  values?: FilterValue[]
  allowsCustomValues?: boolean
  allowHasValue?: boolean
  allowNoValue?: boolean
  allowExcludes?: boolean
  operatorChangeable?: boolean
  singleSelect?: boolean
}

/**
 * Converts a QueryFilter back to Filter[] objects that can be consumed by the SearchFilter component
 * This requires the filter options to properly reconstruct the Filter objects with all their metadata
 */
export const queryFilterToClientFilter = (
  queryFilter: QueryFilter | undefined,
  filterOptions: Option[],
): Filter[] => {
  if (!queryFilter?.conditions || queryFilter.conditions.length === 0) {
    return []
  }

  const filters: Filter[] = []
  const processedConditions = new Set<string>()

  // Process each condition in the query filter
  queryFilter.conditions.forEach((condition) => {
    if ('key' in condition) {
      // This is a QueryCondition
      const filter = convertConditionToFilter(condition, filterOptions, processedConditions)
      if (filter) {
        filters.push(filter)
      }
    } else {
      // This is a nested QueryFilter - recursively process it
      const nestedFilters = queryFilterToClientFilter(condition, filterOptions)
      filters.push(...nestedFilters)
    }
  })

  return filters
}

const convertConditionToFilter = (
  condition: QueryCondition,
  filterOptions: Option[],
  processedConditions: Set<string>,
): Filter | null => {
  const { key, value, operator } = condition

  // Find the matching filter option
  const filterOption = findFilterOption(key, filterOptions)
  if (!filterOption) {
    return null
  }

  // Create a unique key for this condition to avoid duplicates
  const conditionKey = `${key}_${operator}_${JSON.stringify(value)}`
  if (processedConditions.has(conditionKey)) {
    return null
  }
  processedConditions.add(conditionKey)

  // Convert the condition values to FilterValue objects
  const filterValues = convertConditionValueToFilterValues(value, operator, filterOption)

  // Determine if the filter is inverted based on the operator
  const inverted = isInvertedOperator(operator, filterOption.type)

  // Determine the filter operator (AND/OR)
  const filterOperator = getFilterOperator(operator, filterOption.type)

  const filter: Filter = {
    id: filterOption.id,
    type: filterOption.type as Filter['type'],
    label: filterOption.label,
    inverted,
    operator: filterOperator,
    icon: filterOption.icon,
    values: filterValues,
    isCustom: filterOption.allowsCustomValues,
    singleSelect: filterOption.singleSelect,
  }

  return filter
}

const findFilterOption = (key: string, filterOptions: Option[]): Option | undefined => {
  // Try exact match first
  let option = filterOptions.find((opt) => opt.id === key)
  if (option) return option

  // Try to find by the base key (without prefixes)
  option = filterOptions.find(
    (opt) =>
      opt.id.endsWith(key) ||
      opt.id.replace(/^[^.]*\./, '') === key ||
      opt.id.split('_').pop() === key,
  )
  if (option) return option

  // Try to find by label match
  option = filterOptions.find((opt) => opt.label?.toLowerCase() === key.toLowerCase())

  return option
}

const convertConditionValueToFilterValues = (
  value: QueryCondition['value'],
  operator: QueryCondition['operator'],
  filterOption: Option,
): FilterValue[] => {
  // Handle special operators for null/empty checks
  if (operator === 'isnull' || operator === 'notnull') {
    return operator === 'isnull'
      ? [{ id: 'noValue', label: 'No Value' }]
      : [{ id: 'hasValue', label: 'Has Value' }]
  }

  // Handle empty array cases - these represent "No Value" and "Has Value" conditions
  if (Array.isArray(value) && value.length === 0) {
    if (operator === 'eq') {
      // Empty array with 'eq' operator means "No Value"
      return [{ id: 'noValue', label: 'No Value' }]
    } else if (operator === 'ne') {
      // Empty array with 'ne' operator means "Has Value"
      return [{ id: 'hasValue', label: 'Has Value' }]
    }
  }

  if (value === undefined || value === null) {
    return []
  }

  // Convert value(s) to FilterValue objects
  const values = Array.isArray(value) ? value : [value]

  return values.map((val) => {
    const stringValue = String(val)

    // Try to find existing option value with metadata
    const existingValue = filterOption.values?.find((v: FilterValue) => v.id === stringValue)
    if (existingValue) {
      return existingValue
    }

    // Create a basic FilterValue if no existing option found
    return {
      id: stringValue,
      label: stringValue,
      isCustom: true,
    }
  })
}

const isInvertedOperator = (operator: QueryCondition['operator'], type?: string): boolean => {
  const invertedOperators = ['ne', 'notin', 'excludes', 'excludesall', 'excludesany', 'notnull']
  return operator ? invertedOperators.includes(operator) : false
}

const getFilterOperator = (operator: QueryCondition['operator'], type?: string): 'AND' | 'OR' => {
  // For list types, determine AND/OR based on the operator
  if (type?.startsWith('list_of_')) {
    if (operator === 'includesall' || operator === 'excludesall') {
      return 'AND'
    }
    return 'OR'
  }

  // Default to OR for most cases
  return 'OR'
}

export default queryFilterToClientFilter
