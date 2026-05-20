import {
  ColumnDef,
  ColumnOrderState,
  Row,
  ColumnSizingState,
  RowData,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { ContextMenuItemType } from '../ContextMenu'
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

export type ListTableRowContextMenuContext<TData extends RowData> = {
  rowId: string
  rowIndex: number
  row: Row<TData>
  selectedRows: string[]
  isSelected: boolean
  isGroupRow: boolean
  groupColumnId?: string
  groupValue?: unknown
}

export type ListTableRowContextMenuBuilder<TData extends RowData> = (
  e: React.MouseEvent<HTMLTableRowElement>,
  context: ListTableRowContextMenuContext<TData>,
) => ContextMenuItemType | ContextMenuItemType[] | undefined

// Extend TanStack Table Meta to strongly type our mutation and dialog handlers
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    listTableCustomCell?: boolean
  }

  interface TableMeta<TData extends RowData> {
    updateData: (columnId: string, value: unknown, rowId: string) => void
    openViewerDialog?: (row: TData) => void
  }
}

export interface ListTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  getRowId?: (originalRow: TData, index: number) => string
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onUpdateRow: (columnId: string, value: unknown, rowId: string) => void
  onOpenViewer?: (row: TData) => void
  onReorderRows?: (startIndex: number, endIndex: number) => void
  rowContextMenuBuilders?: ListTableRowContextMenuBuilder<TData>[]
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
}
