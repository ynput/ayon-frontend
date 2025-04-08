import { QueryFilter, QueryCondition } from '@api/rest/folders'
import { Filter } from '@ynput/ayon-react-components'

const clientFilterToQueryFilter = (filters: Filter[]): QueryFilter => {
  // If there are no filters, return an empty filter
  if (!filters || filters.length === 0) {
    return {}
  }

  // Process each filter as its own condition
  const conditions: (QueryCondition | QueryFilter)[] = filters
    .filter((f) => !!f.values?.length)
    .filter((f) => !f.id.includes('text')) // remove text search filters as they are handled separately
    .filter((f) => f.id !== 'hierarchy') // remove hierarchy filter as it is handled separately
    .flatMap((filter) => convertFilterToCondition(filter))

  // Return the QueryFilter with all conditions combined with AND
  return {
    conditions,
    operator: 'and',
  }
}

// Helper function to convert a single Filter to a QueryCondition
const convertFilterToCondition = (filter: Filter): QueryCondition => {
  // Extract key from filter ID (split by underscore if needed)
  const key = filter.id.split('_')[0]

  // Handle values based on filter type
  let value: QueryCondition['value']
  if (filter.values && filter.values.length > 0) {
    if (filter.singleSelect) {
      // @ts-expect-error
      value = convertValueByType(filter.values[0].id, filter.type)
    } else {
      // @ts-expect-error
      value = filter.values.map((v) => convertValueByType(v.id, filter.type))
    }
  }

  // there is any value
  const hasSomeValue = Array.isArray(value) && value.map((v) => v.toString())?.includes('hasValue')
  const hasNoValue = Array.isArray(value) && value.map((v) => v.toString())?.includes('noValue')

  // Determine if this is likely a list field based on filter type
  const isListField =
    filter.type?.startsWith('list_of_') || key.includes('tags') || key.includes('assignees')

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
    operator = filter.inverted ? 'eq' : 'ne'
  } else if (hasNoValue) {
    // we set the value to the empty state and then say it should be that
    value = isListField ? [] : undefined
    operator = filter.inverted ? 'ne' : 'eq'
  } else if (isListField) {
    if (filter.inverted) {
      operator = filter.operator === 'AND' ? 'excludesall' : 'excludesany'
    } else {
      operator = filter.operator === 'AND' ? 'includesall' : 'includesany'
    }
  } else {
    // DEFAULT
    // For scalar fields
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
