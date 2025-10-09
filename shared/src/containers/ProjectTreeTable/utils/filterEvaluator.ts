import { QueryFilter, QueryCondition } from '@shared/containers'

/**
 * Evaluates if an entity matches a query filter after an update.
 * Returns true if the entity still matches the filter, false otherwise.
 */
export const doesEntityMatchFilter = (
  entity: Record<string, any>,
  filter?: QueryFilter,
): boolean => {
  if (!filter?.conditions || filter.conditions.length === 0) {
    return true // No filter means all entities match
  }

  const evaluateCondition = (condition: QueryCondition | QueryFilter): boolean => {
    // Check if it's a nested QueryFilter
    if ('conditions' in condition && Array.isArray(condition.conditions)) {
      // Recursively evaluate nested filter
      const results = condition.conditions.map(evaluateCondition)

      if (condition.operator === 'and') {
        return results.every(r => r)
      } else if (condition.operator === 'or') {
        return results.some(r => r)
      }
      return true
    }

    // It's a QueryCondition - evaluate it
    if (!('key' in condition)) return true

    const { key, operator, value } = condition

    // Get the field value from entity (handle nested fields like attrib.fieldName)
    const fieldValue = getFieldValue(entity, key)

    // Evaluate based on operator
    switch (operator) {
      case 'eq':
        return fieldValue === value
      case 'ne':
        return fieldValue !== value
      case 'in':
        // For scalar fields, check if the field value is in the filter value array
        return Array.isArray(value) && (value as any[]).includes(fieldValue)
      case 'notin':
        // Not in - opposite of 'in'
        return Array.isArray(value) && !(value as any[]).includes(fieldValue)
      case 'includes':
        // For array fields like assignees/tags, check if the array includes the value
        return Array.isArray(fieldValue) && (fieldValue as any[]).includes(value)
      case 'excludes':
        // For array fields, check if the array does NOT include the value
        return Array.isArray(fieldValue) && !(fieldValue as any[]).includes(value)
      case 'includesall':
        // Array field must include all values
        return Array.isArray(fieldValue) && Array.isArray(value) && (value as any[]).every(v => (fieldValue as any[]).includes(v))
      case 'excludesall':
        // Array field must exclude all values
        return Array.isArray(fieldValue) && Array.isArray(value) && (value as any[]).every(v => !(fieldValue as any[]).includes(v))
      case 'includesany':
        // Array field must include at least one value
        return Array.isArray(fieldValue) && Array.isArray(value) && (value as any[]).some(v => (fieldValue as any[]).includes(v))
      case 'excludesany':
        // Array field must exclude at least one value
        return Array.isArray(fieldValue) && Array.isArray(value) && (value as any[]).some(v => !(fieldValue as any[]).includes(v))
      case 'gt':
        return value !== undefined && fieldValue > value
      case 'gte':
        return value !== undefined && fieldValue >= value
      case 'lt':
        return value !== undefined && fieldValue < value
      case 'lte':
        return value !== undefined && fieldValue <= value
      case 'like':
        // Like operator - treat as contains
        return String(fieldValue || '').includes(String(value))
      case 'isnull':
        return fieldValue == null
      case 'notnull':
        return fieldValue != null
      default:
        // Unknown operator - assume match to be safe
        return true
    }
  }

  const results = filter.conditions.map(evaluateCondition)

  if (filter.operator === 'and') {
    return results.every(r => r)
  } else if (filter.operator === 'or') {
    return results.some(r => r)
  }

  return true
}

/**
 * Gets a field value from an entity, supporting nested fields like "attrib.fieldName"
 */
const getFieldValue = (entity: Record<string, any>, fieldPath: string): any => {
  const parts = fieldPath.split('.')
  let value: any = entity

  for (const part of parts) {
    if (value == null) return undefined
    value = value[part]
  }

  return value
}
