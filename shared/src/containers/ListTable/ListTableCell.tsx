import React from 'react'
import { flexRender, Row, RowData } from '@tanstack/react-table'
import * as styled from './ListTable.styled'

// 1. Refactored Type: Pass 'content' to the function so it can wrap it naturally
export type CellWrapperRenderer<TData extends RowData> =
  | ((row: Row<TData>, content: React.ReactNode) => React.ReactElement | null)
  | null

interface RowCellsProps<TData extends RowData> {
  row: Row<TData>
  cellWrapper?: CellWrapperRenderer<TData>
}

export const RowCells = <TData extends RowData>({ row, cellWrapper }: RowCellsProps<TData>) => {
  return (
    <>
      {row.getVisibleCells().map((cell) => {
        // 2. Compute variables BEFORE returning JSX
        const content = flexRender(cell.column.columnDef.cell, cell.getContext())
        let wrappedContent: React.ReactNode = content

        // 3. Handle the wrapping logic cleanly without cloneElement
        if (cellWrapper !== null) {
          if (cellWrapper) {
            // Use custom wrapper, passing the content in as a parameter
            wrappedContent = cellWrapper(row, content) || content
          } else {
            // Fallback to default wrapper
            wrappedContent = <styled.ListTableCellWrapper>{content}</styled.ListTableCellWrapper>
          }
        }

        return (
          <styled.TD
            key={cell.id}
            className="p-3 truncate flex-1 flex items-center"
            style={{ width: cell.column.getSize() }}
          >
            {wrappedContent}
          </styled.TD>
        )
      })}
    </>
  )
}
