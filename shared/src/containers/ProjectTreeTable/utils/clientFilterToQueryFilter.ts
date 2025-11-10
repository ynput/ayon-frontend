import { getFilterFromId } from '@ynput/ayon-react-components'
import { QueryCondition, QueryFilter } from '../types/operations'
const NO_DATE = 'no-date'

// New type that cherry picks only the needed fields from Filter
export type FilterForQuery = {
  id: string
  values?: { id: string; values?: { id: string }[]; isCustom?: boolean }[]
  type?: string
  singleSelect?: boolean
  inverted?: boolean
  operator?: string
}

export const clientFilterToQueryFilter = (filters: FilterForQuery[]): QueryFilter => {
  // If there are no filters, return an empty filter
  if (!filters || filters.length === 0) {
    return {}
  }

  // Process each filter as its own condition
  const conditions: (QueryCondition | QueryFilter)[] = filters
    .filter((f) => !!f.values?.length)
    .filter((f) => f.id !== 'hierarchy') // remove hierarchy filter as it is handled separately
    .flatMap((filter) => convertFilterToCondition(filter))

  // Return the QueryFilter with all conditions combined with AND
  return {
    conditions,
    operator: 'and',
  }
}

// Helper function to convert a single Filter to a QueryCondition
const convertFilterToCondition = (filter: FilterForQuery): QueryCondition | QueryFilter => {
  // Extract key from filter ID (split by underscore if needed)
  const key = getFilterFromId(filter.id)

  // Handle values based on filter type
  let value: QueryCondition['value']

  // there is any value
  const hasSomeValue =
    Array.isArray(filter.values) && filter.values.map((v) => v.id)?.includes('hasValue')
  const hasNoValue =
    Array.isArray(filter.values) && filter.values.map((v) => v.id)?.includes('noValue')

  if (filter.values && filter.values.length > 0) {
    if (filter.singleSelect) {
      // @ts-expect-error
      value = convertValueByType(filter.values[0].id, filter.type)
    } else {
      // @ts-expect-error
      value = filter.values.map((v) => convertValueByType(v.id, filter.type))
    }
  }

  // Determine if this is likely a list field based on filter type
  const isListField =
    filter.type?.startsWith('list_of_') || key.includes('tags') || key.includes('assignees')
  const isDateField = filter.type === 'datetime'
  const isBooleanField = filter.type === 'boolean'
  // Version field is a special numeric field that should use exact matching
  const isNumberField =
    key.endsWith('version') || filter.type === 'integer' || filter.type === 'float'

  // Check if any of the values are custom (user-entered values)
  const hasCustomValues = filter.values && filter.values.some((v) => v.isCustom === true)

  // Determine the appropriate operator based on filter properties and type
  let operator: QueryCondition['operator'] = 'eq'

  // Handling NULL values
  if (value === undefined) {
    operator = filter.inverted ? 'notnull' : 'isnull'
    return { key, operator }
  }

  // Handle different filter types
  if (hasSomeValue) {
    // we set the value to the empty state and then say it should not be that
    value = isListField ? [] : undefined
    operator = isListField
      ? filter.inverted
        ? 'eq'
        : 'ne'
      : filter.inverted
      ? 'isnull'
      : 'notnull'
  } else if (hasNoValue) {
    // we set the value to the empty state and then say it should be that
    value = isListField ? [] : undefined
    operator = isListField
      ? filter.inverted
        ? 'ne'
        : 'eq'
      : filter.inverted
      ? 'notnull'
      : 'isnull'
  } else if (isListField) {
    if (filter.inverted) {
      operator = filter.operator === 'AND' ? 'excludesall' : 'excludesany'
    } else {
      operator = filter.operator === 'AND' ? 'includesall' : 'includesany'
    }
  } else if (isDateField) {
    // For date filters, we need to return a complete query filter with conditions
    if (filter.values && filter.values.length > 0) {
      // Create a flat list of all date conditions from all filter values
      const dateConditions: QueryCondition[] = filter.values.flatMap(
        (filterValue: FilterForQuery) => {
          const conditions: QueryCondition[] = []
          const dateValues = filterValue.values

          // First value is greater than (start date)
          if (dateValues?.[0] !== undefined && dateValues?.[0].id !== NO_DATE) {
            conditions.push({
              key,
              operator: filter.inverted ? 'lte' : 'gte',
              value: dateValues[0].id,
            })
          }

          // Second value is less than (end date)
          if (dateValues?.[1] !== undefined && dateValues?.[1].id !== NO_DATE) {
            conditions.push({
              key,
              operator: filter.inverted ? 'gte' : 'lte',
              value: dateValues[1].id,
            })
          }

          return conditions
        },
      )

      // If we have date conditions, return them as a nested filter instead of continuing
      if (dateConditions.length > 0) {
        return {
          conditions: dateConditions,
          operator: filter.inverted ? 'or' : 'and',
        } as QueryFilter
      }
    }

    // If no date conditions were created, fall back to a basic equality check
    operator = filter.inverted ? 'ne' : 'eq'
  } else if (isBooleanField) {
    operator = filter.inverted ? 'ne' : 'eq'
  } else if (hasCustomValues && !isListField && !isNumberField) {
    // Handle custom values with partial matching using LIKE operator
    // If we have custom values, we need to use LIKE operator with wildcards for partial matching
    // Note: Version fields and numeric fields use exact matching (eq/in) instead

    if (!filter.values || filter.values.length === 0) {
      // This shouldn't happen but handle it gracefully
      operator = filter.inverted ? 'notin' : 'in'
    } else {
      // Separate custom and non-custom values
      const customValues = filter.values.filter((v) => v.isCustom === true)
      const nonCustomValues = filter.values.filter((v) => !v.isCustom)

      // If we only have custom values
      if (nonCustomValues.length === 0) {
        if (customValues.length === 1) {
          // Single custom value - use simple LIKE operator
          operator = 'like'
          value = `%${customValues[0].id}%`
        } else {
          // Multiple custom values - create OR conditions for each
          const conditions: QueryCondition[] = customValues.map((v) => ({
            key,
            operator: 'like' as QueryCondition['operator'],
            value: `%${v.id}%`,
          }))

          return {
            conditions,
            operator: filter.inverted ? 'and' : 'or',
          } as QueryFilter
        }
      } else {
        // We have both custom and non-custom values
        // Create separate conditions for each type
        const conditions: QueryCondition[] = []

        // Add non-custom values condition
        if (nonCustomValues.length > 0) {
          conditions.push({
            key,
            operator: filter.inverted ? 'notin' : 'in',
            value: nonCustomValues.map((v) =>
              convertValueByType(v.id, filter.type),
            ) as QueryCondition['value'],
          })
        }

        // Add custom values conditions (each needs its own LIKE)
        customValues.forEach((v) => {
          conditions.push({
            key,
            operator: 'like' as QueryCondition['operator'],
            value: `%${v.id}%`,
          })
        })

        return {
          conditions,
          operator: filter.inverted ? 'and' : 'or',
        } as QueryFilter
      }
    }
  } else {
    // DEFAULT for other scalar fields
    operator = filter.inverted ? 'notin' : 'in'
  }

  return { key, value, operator }
}

// Helper function to convert values based on the filter type
const convertValueByType = (value: string, type?: string): string | number | boolean => {
  if (!type) return value

  switch (type) {
    case 'integer':
      return parseInt(value, 10)
    case 'float':
      return parseFloat(value)
    case 'boolean':
      return value.toLowerCase() === 'true'
    default:
      return value
  }
}

export default clientFilterToQueryFilter
