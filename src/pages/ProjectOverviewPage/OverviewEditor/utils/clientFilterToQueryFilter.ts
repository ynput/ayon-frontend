import { QueryFilter, QueryCondition } from '@api/rest/folders'
import { Filter } from '@ynput/ayon-react-components'

const clientFilterToQueryFilter = (filters: Filter[]): QueryFilter => {
  // If there are no filters, return an empty filter
  if (!filters || filters.length === 0) {
    return {}
  }

  // Process each filter as its own condition
  const conditions: (QueryCondition | QueryFilter)[] = filters.map((filter) =>
    convertFilterToCondition(filter),
  )

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
  let value: string | number | string[] | number[] | undefined
  if (filter.values && filter.values.length > 0) {
    if (filter.singleSelect) {
      value = filter.values[0].id
    } else {
      value = filter.values.map((v) => v.id)
    }
  }

  // Determine if this is likely a list field based on filter type or pattern
  const isListField =
    filter.type?.startsWith('list_of_') ||
    key.includes('tags') ||
    key.includes('assignees') ||
    !filter.singleSelect

  // Determine the appropriate operator based on filter properties and type
  let operator: QueryCondition['operator'] = 'eq'

  // Handling NULL values
  if (value === undefined) {
    operator = filter.inverted ? 'notnull' : 'isnull'
    return { key, operator }
  }

  // Handle different filter types
  if (isListField) {
    // For list fields, we need to use list-compatible operators
    if (Array.isArray(value)) {
      // Multiple values selected for a list field
      operator = filter.inverted ? 'notin' : 'in'
      if (key.includes('tags') || key.includes('assignees')) {
        // Special handling for tags and assignees which typically use "any" operator
        operator = filter.inverted ? 'excludes' : 'any'
      }
    } else {
      // Single value for a list field
      operator = filter.inverted ? 'excludes' : 'contains'
    }
  } else {
    // For scalar fields
    operator = filter.inverted ? 'ne' : 'eq'

    // For numeric fields, more operators could be used based on UI needs
    if (filter.type === 'integer' || filter.type === 'float') {
      // Use appropriate operator, but sticking with eq/ne for now
      // Could extend with lt, gt, lte, gte based on UI controls
    }
  }

  return { key, value, operator }
}

export default clientFilterToQueryFilter
