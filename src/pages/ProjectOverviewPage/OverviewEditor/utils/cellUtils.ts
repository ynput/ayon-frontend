/**
 * Shared cell utilities for table operations
 */

// Type definitions for cell identifiers
export type CellId = string
export type RowId = string
export type ColId = string

// Cell position in the grid
export interface CellPosition {
  rowId: RowId
  colId: ColId
}

// Cell border position flags - used for determining which borders to show
export enum BorderPosition {
  None = 0,
  Top = 1 << 0,
  Right = 1 << 1,
  Bottom = 1 << 2,
  Left = 1 << 3,
  All = Top | Right | Bottom | Left,
}

/**
 * Create a standardized cell ID from row and column IDs
 */
export const getCellId = (rowId: RowId, colId: ColId): CellId => `cell-${rowId}-${colId}`

/**
 * Parse a cell ID to extract row and column IDs
 * @returns CellPosition or null if invalid format
 */
export const parseCellId = (cellId: CellId): CellPosition | null => {
  const match = cellId.match(/^cell-(.+)-(.+)$/)
  if (!match) return null
  return { rowId: match[1], colId: match[2] }
}

/**
 * Determines which borders to display for a selected cell
 * based on its position within the selection grid
 *
 * @param rowIndex Current cell's row index
 * @param colIndex Current cell's column index
 * @param selectedCells 2D array representing selection state (true = selected)
 * @returns BorderPosition flags indicating which borders to display
 */
export const getCellBorders = (
  rowIndex: number,
  colIndex: number,
  selectedCells: boolean[][],
): BorderPosition => {
  if (!selectedCells[rowIndex]?.[colIndex]) {
    return BorderPosition.None
  }

  let borders = BorderPosition.None

  // Check top border
  if (rowIndex === 0 || !selectedCells[rowIndex - 1]?.[colIndex]) {
    borders |= BorderPosition.Top
  }

  // Check right border
  if (!selectedCells[rowIndex]?.[colIndex + 1]) {
    borders |= BorderPosition.Right
  }

  // Check bottom border
  if (!selectedCells[rowIndex + 1]?.[colIndex]) {
    borders |= BorderPosition.Bottom
  }

  // Check left border
  if (colIndex === 0 || !selectedCells[rowIndex]?.[colIndex - 1]) {
    borders |= BorderPosition.Left
  }

  return borders
}

/**
 * Converts border position flags to CSS classes for shadow styling
 */
export const getBorderClasses = (borders: BorderPosition): string[] => {
  const classes: string[] = []

  if (borders & BorderPosition.Top) classes.push('shadow-top')
  if (borders & BorderPosition.Right) classes.push('shadow-right')
  if (borders & BorderPosition.Bottom) classes.push('shadow-bottom')
  if (borders & BorderPosition.Left) classes.push('shadow-left')

  return classes
}
