/**
 * Utility functions for managing meta rows in tables (empty, loading, error, etc.)
 */

export type MetaRowType = 'empty' | 'loading' | 'error' | string

const META_ROW_SEPARATOR = '__'

/**
 * Creates a suffix for a meta row type
 * @param type - The meta row type
 * @returns The meta row suffix in format `__<type>`
 */
const getMetaRowSuffix = (type: MetaRowType): string => {
  return `${META_ROW_SEPARATOR}${type}`
}

/**
 * Creates an ID for a meta row
 * @param entityId - The entity ID to create a meta row for
 * @param type - The type of meta row (empty, loading, error, etc.)
 * @returns The meta row ID in format `{entityId}__{type}`
 */
export const createMetaRowId = (entityId: string, type: MetaRowType): string => {
  return `${entityId}${getMetaRowSuffix(type)}`
}

/**
 * Parses a meta row ID to extract the entity ID and type
 * @param metaRowId - The meta row ID to parse
 * @returns An object with entityId and type, or null if the ID is not a valid meta row ID
 */
export const parseMetaRowId = (
  metaRowId: string,
): { entityId: string; type: MetaRowType } | null => {
  const lastSeparatorIndex = metaRowId.lastIndexOf(META_ROW_SEPARATOR)
  if (lastSeparatorIndex === -1) {
    return null
  }
  const entityId = metaRowId.slice(0, lastSeparatorIndex)
  const type = metaRowId.slice(lastSeparatorIndex + META_ROW_SEPARATOR.length) as MetaRowType
  return { entityId, type }
}

/**
 * Checks if a row ID is a meta row ID
 * @param rowId - The row ID to check
 * @returns true if the row ID is a meta row ID
 */
export const isMetaRowId = (rowId: string): boolean => {
  return rowId.includes(META_ROW_SEPARATOR) && parseMetaRowId(rowId) !== null
}

/**
 * Checks if a row ID is a specific type of meta row
 * @param rowId - The row ID to check
 * @param type - The meta row type to check for
 * @returns true if the row ID is a meta row of the specified type
 */
export const isMetaRowType = (rowId: string, type: MetaRowType): boolean => {
  const parsed = parseMetaRowId(rowId)
  return parsed?.type === type
}
