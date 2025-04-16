import { ColumnSizingState, Table } from '@tanstack/react-table'
import { useMemo } from 'react'
import { TableRow } from '../types/table'

// convert column sizing state to CSS variables
const useCustomColumnWidthVars = (table: Table<TableRow>, columnSizing: ColumnSizingState) => {
  const headers = table.getFlatHeaders()
  const columnSizingInfo = table.getState().columnSizingInfo

  const columnSizeVars = useMemo(() => {
    const colSizes: { [key: string]: number } = {}
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!
      colSizes[`--header-${header.id}-size`] = header.getSize()
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize()
    }
    return colSizes
  }, [columnSizingInfo, columnSizing, headers])

  return columnSizeVars
}

export default useCustomColumnWidthVars
