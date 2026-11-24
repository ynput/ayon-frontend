import { CSSProperties } from 'react'
import { Column } from '@tanstack/react-table'
import type { TableRow } from '../types/table'

// Sticky column pinning styles shared by header, body and footer cells.
export const getCommonPinningStyles = (column: Column<TableRow, unknown>): CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 100 : 0,
  }
}

export const getColumnWidth = (columnId: string) => {
  return `calc(var(--col-${columnId}-size) * 1px)`
}
