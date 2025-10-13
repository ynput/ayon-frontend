import { QueryFilter, QueryCondition } from '@shared/containers'
import { OperationModel } from '@shared/api'

/**
 * Extracts all field keys from a filter recursively
 * Example: { conditions: [{ key: 'status', operator: 'in', value: ['on hold'] }] }
 * Returns: ['status']
 */
export const extractFilterKeys = (filter?: QueryFilter): Set<string> => {
  const keys = new Set<string>()

  if (!filter?.conditions) {
    return keys
  }

  const processCondition = (condition: QueryCondition | QueryFilter) => {
    // Check if it's a nested QueryFilter
    if ('conditions' in condition && Array.isArray(condition.conditions)) {
      // Recursively process nested filters
      condition.conditions.forEach(processCondition)
    } else if ('key' in condition) {
      // It's a QueryCondition - add the key
      keys.add(condition.key)
    }
  }

  filter.conditions.forEach(processCondition)
  return keys
}

/**
 * Checks if any updated field matches a filter key
 * Handles both direct fields (e.g., 'status') and nested fields (e.g., 'attrib.priority')
 */
export const doesUpdateAffectFilter = (
  operations: Pick<OperationModel, 'data'>[],
  filterKeys: Set<string>,
): boolean => {
  if (filterKeys.size === 0) {
    return false // No filters active
  }

  for (const operation of operations) {
    const data = operation.data || {}

    // Check top-level fields
    for (const field of Object.keys(data)) {
      if (field === 'attrib') {
        // Handle nested attrib fields
        const attribData = data.attrib || {}
        for (const attribField of Object.keys(attribData)) {
          // Check both 'attrib.fieldName' and just 'fieldName' formats
          if (filterKeys.has(`attrib.${attribField}`) || filterKeys.has(attribField)) {
            return true
          }
        }
      } else {
        // Check top-level fields
        if (filterKeys.has(field)) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Extracts unique entity IDs from operations
 */
export const getUpdatedEntityIds = (
  operations: Pick<OperationModel, 'entityId'>[],
): string[] => {
  return [...new Set(operations.map((op) => op.entityId).filter(Boolean))] as string[]
}