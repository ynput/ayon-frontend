import {
  VisibilityState,
  ColumnPinningState,
  ColumnOrderState,
  ColumnSizingState,
} from '@tanstack/react-table'
import { ColumnItemModel } from '@shared/api/generated/views'

export interface TanstackTableStates {
  columnVisibility: VisibilityState
  columnPinning: ColumnPinningState
  columnOrder: ColumnOrderState
  columnSizing: ColumnSizingState
}

/**
 * Converts ColumnItemModel array to tanstack table states
 */
export function convertColumnConfigToTanstackStates(
  columns: ColumnItemModel[] = [],
): TanstackTableStates {
  const columnVisibility: VisibilityState = {}
  const columnPinning: ColumnPinningState = { left: [], right: [] }
  const columnOrder: ColumnOrderState = []
  const columnSizing: ColumnSizingState = {}

  // Process each column configuration
  columns.forEach((column) => {
    const { name, pinned, width } = column

    // Set column as visible (since it's in the config)
    columnVisibility[name] = true

    // Add to column order
    columnOrder.push(name)

    // Handle pinning - assuming pinned: true means left pinning
    if (pinned) {
      columnPinning.left?.push(name)
    }

    // Set column width if provided
    if (width !== undefined) {
      columnSizing[name] = width
    }
  })

  return {
    columnVisibility,
    columnPinning,
    columnOrder,
    columnSizing,
  }
}

/**
 * Converts tanstack table states back to ColumnItemModel array
 */
export function convertTanstackStatesToColumnConfig(
  states: TanstackTableStates,
): ColumnItemModel[] {
  const { columnVisibility, columnPinning, columnOrder, columnSizing } = states
  const columns: ColumnItemModel[] = []

  // Use column order as the primary source of truth for which columns to include
  // If no order is specified, fall back to visible columns
  const orderedColumns =
    columnOrder.length > 0
      ? columnOrder
      : Object.keys(columnVisibility).filter((col) => columnVisibility[col])

  orderedColumns.forEach((columnName) => {
    // Only include visible columns
    if (columnVisibility[columnName] !== false) {
      const column: ColumnItemModel = {
        name: columnName,
      }

      // Check if column is pinned (checking both left and right)
      const isPinnedLeft = columnPinning.left?.includes(columnName)

      if (isPinnedLeft) {
        column.pinned = true
      }

      // Add width if specified
      if (columnSizing[columnName] !== undefined) {
        column.width = columnSizing[columnName]
      }

      columns.push(column)
    }
  })

  return columns
}
