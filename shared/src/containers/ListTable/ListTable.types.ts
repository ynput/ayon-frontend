import {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  Row,
  RowData,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { CellWrapperRenderer } from './ListTableCell'
import { ListTableColumnAttributeData, ListTableDataTypeWidgets } from './ListTableWidgets'

export type ListTableGroupDisplay = {
  value?: unknown
  label?: string
  icon?: string
  color?: string
  sortValue?: string | number
  sortIndex?: number
}

export type ListTableGroupingPathItem = unknown | ListTableGroupDisplay

// Extend TanStack Table Meta to strongly type our mutation and dialog handlers
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    listTableCustomCell?: boolean
  }

  interface TableMeta<TData extends RowData> {
    updateData: (columnId: string, value: unknown, rowIndex: number) => void
    openViewerDialog?: (row: TData) => void
  }
}

export interface ListTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onUpdateRow: (columnId: string, value: unknown, rowIndex: number) => void
  onOpenViewer?: (row: TData) => void
  onReorderRows?: (startIndex: number, endIndex: number) => void
  selectedRows?: string[]
  onSelectedRowsChange?: (ids: string[]) => void
  multiSelection?: boolean
  cellWrapper?: CellWrapperRenderer<TData>
  columnAttributeData?: ListTableColumnAttributeData
  dataTypeWidgets?: ListTableDataTypeWidgets<TData>
  // Column reordering
  enableColumnReordering?: boolean
  columnOrder?: ColumnOrderState
  onColumnOrderChange?: (order: ColumnOrderState) => void
  // Column visibility
  enableColumnVisibility?: boolean
  columnVisibility?: VisibilityState
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  // Column resizing
  enableColumnResizing?: boolean
  columnSizing?: ColumnSizingState
  onColumnSizingChange?: (sizing: ColumnSizingState) => void
  // Sorting
  enableSorting?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  // Grouping
  grouping?: string[]
  onGroupingChange?: (grouping: string[]) => void
  groupSortByDesc?: boolean
  /** Expand one grouping column into nested subgroup levels for a row. */
  getGroupingPath?: (columnId: string, row: TData) => ListTableGroupingPathItem[] | undefined
  /** Resolve label/icon/color for grouped row headers. */
  getGroupDisplay?: (columnId: string, value: unknown) => ListTableGroupDisplay | undefined
}
