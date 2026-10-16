import { createContext, useContext } from 'react'
import type { CellMark } from '../../types/table'

// What the table knows about the cell being rendered, from its row: set by the TD around every
// cell, read by CellWidget, so columns don't have to pass it on themselves
export type TableCellContextValue = {
  mark?: CellMark // TableRow.cellMarks[column id]
  isRowReadOnly?: boolean // TableRow.readOnly
}

export const TableCellContext = createContext<TableCellContextValue>({})

export const useTableCellContext = () => useContext(TableCellContext)
