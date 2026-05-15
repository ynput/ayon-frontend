import { flexRender, Row, RowData } from '@tanstack/react-table'
import * as styled from './ListTable.styled'

export const RowCells = <TData extends RowData>({ row }: { row: Row<TData> }) => {
  return (
    <>
      {row.getVisibleCells().map((cell) => (
        <styled.TD
          key={cell.id}
          className="p-3 truncate flex-1 flex items-center"
          style={{ width: cell.column.getSize() }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </styled.TD>
      ))}
    </>
  )
}
