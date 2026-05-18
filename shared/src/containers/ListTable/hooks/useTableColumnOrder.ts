import { useState, useEffect } from 'react'
import { ColumnDef, ColumnOrderState, RowData } from '@tanstack/react-table'

export function useTableColumnOrder<TData extends RowData>(
  columns: ColumnDef<TData, any>[],
  columnOrderProp?: ColumnOrderState,
) {
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    if (columnOrderProp && columnOrderProp.length > 0) {
      const allIds = columns.map((c) => c.id as string)
      const missing = allIds.filter((id) => !columnOrderProp.includes(id))
      return [...columnOrderProp, ...missing]
    }
    return columns.map((c) => c.id as string)
  })

  // Sync external column order when it changes (e.g. after view settings load)
  useEffect(() => {
    if (columnOrderProp && columnOrderProp.length > 0) {
      const allIds = columns.map((c) => c.id as string)
      const missing = allIds.filter((id) => !columnOrderProp.includes(id))
      setColumnOrder([...columnOrderProp, ...missing])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnOrderProp])

  return { columnOrder, setColumnOrder }
}
