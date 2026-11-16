import type { ColumnDef } from '@tanstack/react-table'
import type { TreeTableExtraColumn } from '../buildTreeTableColumns'
import type { TableRow } from '../types/table'

// Kept apart from buildTreeTableColumns, so extra columns (addon columns register while the page
// loads) don't rebuild the other columns: a new cell function remounts that column's cells.
export const insertExtraColumns = (
  columns: ColumnDef<TableRow>[],
  extraColumns: TreeTableExtraColumn[] = [],
) => {
  const allColumns = [...columns]
  extraColumns.forEach(({ column, position = -1, after }) => {
    const afterIndex = after ? allColumns.findIndex((c) => c.id === after) : -1
    if (afterIndex >= 0) {
      allColumns.splice(afterIndex + 1, 0, column)
    } else if (position >= 0 && position < allColumns.length) {
      allColumns.splice(position, 0, column)
    } else {
      allColumns.push(column)
    }
  })
  return allColumns
}
