import { Filter, FilterValue, SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import { QueryFilter, QueryCondition } from '../types/operations'
import { format, parseISO, isValid } from 'date-fns'
import { detectRelativeDatePattern } from '@shared/components/SearchFilter/filterDates'
import { isRelativeDateValue, resolveRelativeValue } from './expandRelativeDates'

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
      // This is a nested QueryFilter - check if it's a datetime range (gte+lte same key)
      const datetimeFilter = tryMergeDatetimeRange(condition, filterOptions)
      if (datetimeFilter) {
        filters.push(datetimeFilter)
      } else {
        // Recursively process other nested QueryFilters
        const nestedFilters = queryFilterToClientFilter(condition, filterOptions)
        filters.push(...nestedFilters)
      }
    }
  })

  return filters
}

/**
 * Detects nested QueryFilters that represent datetime ranges (gte+lte on the same key)
 * and merges them into a single datetime Filter with proper range values.
 */
const tryMergeDatetimeRange = (
  nestedFilter: QueryFilter,
  filterOptions: Option[],
): Filter | null => {
  if (!nestedFilter.conditions || nestedFilter.conditions.length < 1) return null

  // All conditions must be QueryConditions (not nested QueryFilters)
  const conditions = nestedFilter.conditions.filter(
    (c): c is QueryCondition => 'key' in c,
  )
  if (conditions.length !== nestedFilter.conditions.length) return null

  // All conditions must share the same key
  const key = conditions[0].key
  if (!conditions.every((c) => c.key === key)) return null

  // Find the matching filter option and check it's a datetime type
  const filterOption = findFilterOption(key, filterOptions)
  if (!filterOption || filterOption.type !== 'datetime') return null

  // Extract gte (start) and lte (end) values, resolving relative dates
  const gteCondition = conditions.find((c) => c.operator === 'gte')
  const lteCondition = conditions.find((c) => c.operator === 'lte')
  if (!gteCondition && !lteCondition) return null

  const rawStartValue = gteCondition?.value as string | undefined
  const rawEndValue = lteCondition?.value as string | undefined
  const startISO = rawStartValue && isRelativeDateValue(rawStartValue) ? resolveRelativeValue(rawStartValue) : rawStartValue
  const endISO = rawEndValue && isRelativeDateValue(rawEndValue) ? resolveRelativeValue(rawEndValue) : rawEndValue

  // Build the range label
  let label = 'Custom range'
  if (startISO && endISO) {
    // Check if it matches a relative date pattern first
    const relativePattern = detectRelativeDatePattern(startISO, endISO)
    if (relativePattern) {
      label = relativePattern.label
    } else {
      // Fall back to showing the date range
      const startDate = parseISO(startISO)
      const endDate = parseISO(endISO)
      if (isValid(startDate) && isValid(endDate)) {
        const currentYear = new Date().getFullYear()
        const endDateFormat = endDate.getFullYear() === currentYear ? 'MMM d' : 'MMM d, yyyy'
        label = `${format(startDate, 'MMM d')} – ${format(endDate, endDateFormat)}`
      }
    }
  }

  // `values` holds the gte/lte range pair — used by clientFilterToQueryFilter for round-trip
  // but not part of the FilterValue type, so we extend it at runtime
  const rangeValue = {
    id: `custom-${startISO || ''}-${endISO || ''}`,
    label,
    values: [
      ...(startISO ? [{ id: startISO, label: isValid(parseISO(startISO)) ? format(parseISO(startISO), 'MMM d, yyyy') : startISO }] : []),
      ...(endISO ? [{ id: endISO, label: isValid(parseISO(endISO)) ? format(parseISO(endISO), 'MMM d, yyyy') : endISO }] : []),
    ],
  } as FilterValue

  return {
    id: filterOption.id,
    type: filterOption.type as Filter['type'],
    label: filterOption.label,
    icon: filterOption.icon,
    inverted: nestedFilter.operator === 'or',
    values: [rangeValue],
    singleSelect: filterOption.singleSelect,
  }
}

const convertConditionToFilter = (
  condition: QueryCondition,
  filterOptions: Option[],
  processedConditions: Set<string>,
): Filter | null => {
  const { key, value, operator } = condition

  // check if the filter is a text search filter
  if (key === SEARCH_FILTER_ID) {
    const valuesArray = Array.isArray(value) ? value : [value || '']
    const filter: Filter = {
      id: SEARCH_FILTER_ID,
      type: 'string',
      label: '',
      values: valuesArray.map((v) => ({ id: String(v), label: String(v) })),
    }

    return filter
  }

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
    let stringValue = String(val)
    let isCustomValue = false

    // Handle LIKE operator with wildcards - strip them and mark as custom
    if (operator === 'like' && typeof val === 'string') {
      // Remove leading and trailing % wildcards
      stringValue = val.replace(/^%/, '').replace(/%$/, '')
      isCustomValue = true
    }

    // Try to find existing option value with metadata (only if not already marked as custom from LIKE)
    if (!isCustomValue) {
      const existingValue = filterOption.values?.find((v: FilterValue) => v.id === stringValue)
      if (existingValue) {
        return existingValue
      }
    }

    // Format datetime values nicely instead of showing raw ISO strings
    if (filterOption.type === 'datetime' && typeof val === 'string') {
      try {
        const date = parseISO(val)
        if (isValid(date)) {
          return {
            id: stringValue,
            label: format(date, 'MMM d, yyyy'),
            isCustom: true,
          }
        }
      } catch {
        // fall through to default
      }
    }

    // Create a basic FilterValue if no existing option found or if it's a LIKE value
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
