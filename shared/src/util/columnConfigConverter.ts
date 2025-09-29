import {
  VisibilityState,
  ColumnPinningState,
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
} from '@tanstack/react-table'
import { ColumnItemModel, OverviewSettings } from '@shared/api/generated/views'
import { ColumnsConfig, TableGroupBy } from '@shared/containers'
import { GroupByConfig } from '@shared/containers/ProjectTreeTable/components/GroupSettingsFallback'

/**
 * Converts ColumnItemModel array from OverviewSettings to TanStack table states
 */
export function convertColumnConfigToTanstackStates(settings: OverviewSettings): ColumnsConfig {
  const { columns = [], groupBy: groupByField, showEmptyGroups, sortBy, sortDesc, rowHeight } = settings || {}

  // Initialize state objects
  const columnVisibility: VisibilityState = {}
  const columnPinning: ColumnPinningState = { left: [], right: [] }
  const columnOrder: ColumnOrderState = []
  const columnSizing: ColumnSizingState = {}

  // Process each column from the settings
  columns.forEach((column) => {
    const { name, visible, pinned, width } = column

    // Column visibility: if visible is undefined, default to true
    columnVisibility[name] = visible !== false

    // Column order: maintain the order from the settings
    columnOrder.push(name)

    // Column pinning: assuming pinned: true means left pinning
    if (pinned) {
      columnPinning.left?.push(name)
    }

    // Column sizing: set width if provided
    if (width !== undefined) {
      columnSizing[name] = width
    }
  })

  // Handle sorting
  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortDesc || false }] : []

  // Handle grouping
  const groupBy: TableGroupBy | undefined = groupByField
    ? { id: groupByField, desc: false }
    : undefined

  const groupByConfig: GroupByConfig = {
    showEmpty: showEmptyGroups || false,
  }

  return {
    columnVisibility,
    columnPinning,
    columnOrder,
    columnSizing,
    sorting,
    groupBy,
    groupByConfig,
    rowHeight: rowHeight ?? 34,
  }
}

/**
 * Determines the final column order based on columnOrder and allColumnIds
 * - Columns in columnOrder come first (in their specified order)
 * - Remaining columns follow the order from allColumnIds
 */
function determineColumnOrder(
  columnOrder: ColumnOrderState,
  allColumnIds: string[],
  columnsWithState: Set<string>,
): string[] {
  // Start with columns from columnOrder (these have explicit positioning)
  const orderedColumns = [...columnOrder]

  // Add remaining columns from allColumnIds that aren't already in columnOrder
  const remainingColumns = allColumnIds.filter(
    (columnId) => !columnOrder.includes(columnId) && columnsWithState.has(columnId),
  )

  return [...orderedColumns, ...remainingColumns]
}

/**
 * Collects all columns that have any state (visibility, sizing, pinning, etc.)
 */
function collectColumnsWithState(
  columnVisibility: VisibilityState,
  columnSizing: ColumnSizingState,
  columnPinning: ColumnPinningState,
  allColumnIds: string[],
): Set<string> {
  const columnsWithState = new Set<string>()

  // Add columns with visibility state
  Object.keys(columnVisibility).forEach((col) => columnsWithState.add(col))

  // Add columns with sizing state
  Object.keys(columnSizing).forEach((col) => columnsWithState.add(col))

  // Add pinned columns
  columnPinning.left?.forEach((col) => columnsWithState.add(col))
  columnPinning.right?.forEach((col) => columnsWithState.add(col))

  // Add any additional columns from allColumnIds
  allColumnIds?.forEach((col) => columnsWithState.add(col))

  return columnsWithState
}

/**
 * Creates a ColumnItemModel for a given column name with all applicable state
 */
function createColumnItem(
  columnName: string,
  columnVisibility: VisibilityState,
  columnPinning: ColumnPinningState,
  columnSizing: ColumnSizingState,
): ColumnItemModel {
  const column: ColumnItemModel = {
    name: columnName,
  }

  // Set visibility if defined in state
  if (columnVisibility.hasOwnProperty(columnName)) {
    column.visible = columnVisibility[columnName]
  }

  // Set pinning if column is pinned
  const isPinnedLeft = columnPinning.left?.includes(columnName)
  const isPinnedRight = columnPinning.right?.includes(columnName)

  if (isPinnedLeft || isPinnedRight) {
    column.pinned = true
  }

  // Set width if defined in state
  if (columnSizing[columnName] !== undefined) {
    column.width = columnSizing[columnName]
  }

  return column
}

/**
 * Converts TanStack table states back to OverviewSettings format
 *
 * Column ordering logic:
 * 1. Columns in columnOrder appear first (in their specified order)
 * 2. Remaining columns follow the order from allColumnIds
 * 3. Only columns with state (visibility, sizing, pinning) or in allColumnIds are included
 */
export function convertTanstackStatesToColumnConfig(
  states: ColumnsConfig,
  allColumnIds?: string[],
): OverviewSettings {
  const {
    columnVisibility,
    columnPinning,
    columnOrder,
    columnSizing,
    sorting,
    groupBy,
    groupByConfig,
    rowHeight,
  } = states

  // Collect all columns that have any state
  const columnsWithState = collectColumnsWithState(
    columnVisibility,
    columnSizing,
    columnPinning,
    allColumnIds || [],
  )

  // Determine the final column order
  const finalColumnOrder = determineColumnOrder(columnOrder, allColumnIds || [], columnsWithState)

  // Create ColumnItemModel for each column in the determined order
  const columns: ColumnItemModel[] = finalColumnOrder.map((columnName) =>
    createColumnItem(columnName, columnVisibility, columnPinning, columnSizing),
  )

  // Build the result object
  const result: OverviewSettings = {
    columns,
  }

  // Add grouping information if present
  if (groupBy) {
    result.groupBy = groupBy.id
  } else {
    result.groupBy = undefined
  }

  if (groupByConfig?.showEmpty !== undefined) {
    result.showEmptyGroups = groupByConfig.showEmpty
  }

  // Add sorting information if present
  if (sorting) {
    if (sorting.length > 0) {
      // find the column that is being sorted
      const firstSort = sorting[0]
      result.sortBy = firstSort.id
      result.sortDesc = firstSort.desc
    } else {
      // remove sorting
      result.sortBy = undefined
      result.sortDesc = undefined
    }
  }

  // Add row height if present
  if (rowHeight !== undefined) {
    result.rowHeight = rowHeight
  }

  return result
}
