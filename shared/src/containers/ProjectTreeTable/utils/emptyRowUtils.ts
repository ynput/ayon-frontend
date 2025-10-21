/**
 * Utility functions for managing empty rows in the versions table
 */

const EMPTY_ROW_SUFFIX = '_empty'

/**
 * Creates an ID for an empty row
 * @param productId - The product ID to create an empty row for
 * @returns The empty row ID in format `{productId}_empty`
 */
export const createEmptyRowId = (productId: string): string => {
  return `${productId}${EMPTY_ROW_SUFFIX}`
}

/**
 * Parses an empty row ID to extract the product ID
 * @param emptyRowId - The empty row ID to parse
 * @returns The product ID, or null if the ID is not a valid empty row ID
 */
export const parseEmptyRowId = (emptyRowId: string): string | null => {
  if (!emptyRowId.endsWith(EMPTY_ROW_SUFFIX)) {
    return null
  }
  return emptyRowId.slice(0, -EMPTY_ROW_SUFFIX.length)
}

/**
 * Checks if a row ID is an empty row ID
 * @param rowId - The row ID to check
 * @returns true if the row ID is an empty row ID
 */
export const isEmptyRowId = (rowId: string): boolean => {
  return rowId.endsWith(EMPTY_ROW_SUFFIX)
}
