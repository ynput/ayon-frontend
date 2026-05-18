import { ColumnDef, ColumnOrderState, Row, RowData, SortingState } from '@tanstack/react-table'
import { CellWrapperRenderer } from './ListTableCell'
import { ListTableColumnAttributeData, ListTableDataTypeWidgets } from './ListTableWidgets'

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
  // Sorting
  enableSorting?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
}
