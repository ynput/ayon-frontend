import { ProjectTableAttribute } from '@shared/containers'
import type { TableGroupBy } from '../containers/ProjectTreeTable/context'
import { AttributeModel } from '@shared/api'

type DataType = 'string' | 'list_of_strings' | string

/**
 * Determines the data type for a groupBy field.
 * Handles special cases for built-in group types (assignees, tags) and attribute-based grouping.
 *
 * @param groupBy - The group by configuration
 * @param attribFields - Array of available attribute fields
 * @returns The data type as a string ('string', 'list_of_strings', or the attribute type)
 *
 * @example
 * const dataType = getGroupByDataType(groupBy, attribFields)
 * // Returns 'list_of_strings' for assignees/tags
 * // Returns the attribute type for 'attrib.attributeName'
 * // Returns 'string' as default fallback
 */
export const getGroupByDataType = (
  groupBy: TableGroupBy | undefined,
  attribFields: (ProjectTableAttribute | AttributeModel)[],
): DataType => {
  if (!groupBy?.id || typeof groupBy.id !== 'string') return 'string'

  const groupById = groupBy.id

  // Handle special cases for built-in group types
  if (groupById === 'assignees' || groupById === 'tags') {
    return 'list_of_strings'
  }

  // Handle attribute-based grouping (format: "attrib.attributeName")
  if (groupById.startsWith('attrib.')) {
    const attributeName = groupById.split('.')[1]
    const attribute = attribFields.find((field) => field.name === attributeName)
    return attribute?.data?.type || 'string'
  }

  // Default fallback
  return 'string'
}
