import { RowData, Table } from '@tanstack/react-table'
import { useMemo } from 'react'

/**
 * Computes CSS variable key/value pairs for each column's current size.
 * Apply these as inline style on the <table> element so that column-width
 * changes during resize only mutate a single DOM node's style attribute —
 * no React re-renders of rows are triggered.
 *
 * Header cells should use: `calc(var(--header-{id}-size) * 1px)`
 * Body cells should use:   `calc(var(--col-{id}-size) * 1px)`
 */
export function useColumnWidthVars<TData extends RowData>(table: Table<TData>) {
  const headers = table.getFlatHeaders()
  const columnSizing = table.getState().columnSizing

  return useMemo(() => {
    const vars: Record<string, number> = {}
    for (const header of headers) {
      vars[`--header-${header.id}-size`] = header.getSize()
      vars[`--col-${header.column.id}-size`] = header.column.getSize()
    }
    return vars
    // Recompute only when committed column sizes change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSizing, headers])
}
