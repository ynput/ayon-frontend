import { CSSProperties } from 'react'
import { Column } from '@tanstack/react-table'
import { ROW_SELECTION_COLUMN_ID } from '../constants'
import type { TableRow } from '../types/table'

export const DRAG_HANDLE_COLUMN_ID = 'drag-handle'

// Sticky column pinning styles shared by header, body and footer cells.
export const getCommonPinningStyles = (column: Column<TableRow, unknown>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const offset =
    column.id !== ROW_SELECTION_COLUMN_ID && column.id !== DRAG_HANDLE_COLUMN_ID ? -30 : 0

  return {
    left: isPinned === 'left' ? `${column.getStart('left') + offset}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 100 : 0,
  }
}

export const getColumnWidth = (columnId: string) => {
  return `calc(var(--col-${columnId}-size) * 1px)`
}
