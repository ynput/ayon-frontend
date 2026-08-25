import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable/context/ColumnSettingsContext'
import {
  DRAG_HANDLE_COLUMN_ID,
  ROW_SELECTION_COLUMN_ID,
} from '@shared/containers/ProjectTreeTable/constants'
import {
  COLUMN_HEADER_SELECTOR,
  ColumnDropLine,
  getColumnDropLinePosition,
} from '@shared/containers/ProjectTreeTable/components/ColumnDropIndicator'
import { TABLE_CONTAINER_ATTR } from '@shared/containers/ProjectTreeTable/hooks/useColumnDragRestriction'
import { useMenuContext } from '@shared/context'
import { MENU_PORTAL_CONTENT_ID } from '../Menu/MenuContainer'
import type { AddColumnItem } from './addColumnsMenu'

const SPECIAL_COLUMNS = [DRAG_HANDLE_COLUMN_ID, ROW_SELECTION_COLUMN_ID]
const DRAG_THRESHOLD = 5

type DropTarget = {
  columnId: string
  side: 'left' | 'right'
  line: { left: number; top: number; height: number }
}
// the ghost keeps the point the row was grabbed by, like the table's own column drag
type GrabOffset = { x: number; y: number; width: number }
type DragState = {
  column: AddColumnItem
  x: number
  y: number
  grab: GrabOffset
  target: DropTarget | null
}
// the menu portal and the settings panel both host draggable column items
const ORIGIN_SELECTOR = `#${MENU_PORTAL_CONTENT_ID}, [data-column-drag-origin]`

// anywhere over the table body counts too: project x up onto the header row
const findHeaderByX = (x: number, y: number): HTMLElement | undefined => {
  const container = document.querySelector(`[${TABLE_CONTAINER_ATTR}]`)
  const rect = container?.getBoundingClientRect()
  if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return undefined
  const headers = Array.from(
    document.querySelectorAll<HTMLElement>(COLUMN_HEADER_SELECTOR),
  ).filter((el) => !SPECIAL_COLUMNS.includes(el.dataset.columnId || ''))
  const hit = headers.find((el) => {
    const r = el.getBoundingClientRect()
    return x >= r.left && x < r.right
  })
  // past the last column still drops, snapping to the nearest edge
  if (hit || !headers.length) return hit
  const last = headers[headers.length - 1]
  return x >= last.getBoundingClientRect().right ? last : headers[0]
}

const findDropTarget = (x: number, y: number): DropTarget | null => {
  // the menu dialog covers the page, so hit-test through the whole stack of elements
  const header =
    (document
      .elementsFromPoint(x, y)
      .map((el) => (el as HTMLElement).closest?.(COLUMN_HEADER_SELECTOR))
      .find(Boolean) as HTMLElement | undefined) ?? findHeaderByX(x, y)
  const columnId = header?.dataset.columnId
  if (!header || !columnId || SPECIAL_COLUMNS.includes(columnId)) return null
  const rect = header.getBoundingClientRect()
  const side = x < rect.left + rect.width / 2 ? 'left' : 'right'
  return {
    columnId,
    side,
    line: getColumnDropLinePosition(header, side),
  }
}

// headers are virtualized, so the DOM only holds the visible slice: never read the order from it
const resolveColumnOrder = (savedOrder: string[], allColumns: string[]) => {
  const base = savedOrder.length ? savedOrder : allColumns
  return [...base, ...allColumns.filter((id) => !base.includes(id))]
}

// drag a column out of the add-column menu and drop it where it belongs in the table header
export const useAddColumnDrag = () => {
  const {
    columnVisibility,
    columnOrder,
    columnPinning,
    columnSizing,
    columnSummaries,
    columnSummaryScopes,
    columnSummaryFormats,
    groupBy,
    groupByConfig,
    sorting,
    rowHeight,
    setColumnsConfig,
    getAllColumns,
  } = useColumnSettingsContext()
  const { setMenuOpen } = useMenuContext()

  const [drag, setDrag] = useState<DragState | null>(null)
  const armedRef = useRef<{
    column: AddColumnItem
    x: number
    y: number
    origin: HTMLElement | null
    immediate: boolean
    grab: GrabOffset
  } | null>(null)
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag

  const latestRef = useRef({
    columnVisibility,
    columnOrder,
    columnPinning,
    columnSizing,
    columnSummaries,
    columnSummaryScopes,
    columnSummaryFormats,
    groupBy,
    groupByConfig,
    sorting,
    rowHeight,
    setColumnsConfig,
    getAllColumns,
  })
  latestRef.current = {
    columnVisibility,
    columnOrder,
    columnPinning,
    columnSizing,
    columnSummaries,
    columnSummaryScopes,
    columnSummaryFormats,
    groupBy,
    groupByConfig,
    sorting,
    rowHeight,
    setColumnsConfig,
    getAllColumns,
  }

  // showing, ordering and pinning in one config: the updaters each persist the whole config
  const dropColumn = useCallback((columnId: string, target: DropTarget) => {
    const config = latestRef.current
    const order = resolveColumnOrder(config.columnOrder, config.getAllColumns()).filter(
      (id) => id !== columnId && !SPECIAL_COLUMNS.includes(id),
    )
    const targetIndex = order.indexOf(target.columnId)
    const insertAt = targetIndex === -1 ? order.length : targetIndex + (target.side === 'left' ? 0 : 1)
    const newOrder = [...order.slice(0, insertAt), columnId, ...order.slice(insertAt)]

    // dropping into the pinned section pins the column too, dropping out of it unpins
    const pinned = new Set(config.columnPinning.left || [])
    if (pinned.has(target.columnId)) pinned.add(columnId)
    else pinned.delete(columnId)

    config.setColumnsConfig({
      columnVisibility: { ...config.columnVisibility, [columnId]: true },
      columnOrder: newOrder,
      columnPinning: { ...config.columnPinning, left: newOrder.filter((id) => pinned.has(id)) },
      columnSizing: config.columnSizing,
      columnSummaries: config.columnSummaries,
      columnSummaryScopes: config.columnSummaryScopes,
      columnSummaryFormats: config.columnSummaryFormats,
      groupBy: config.groupBy,
      groupByConfig: config.groupByConfig,
      sorting: config.sorting,
      rowHeight: config.rowHeight,
    })
  }, [])

  const cancelDrag = useCallback(() => {
    armedRef.current = null
    if (dragRef.current) setDrag(null)
  }, [])

  // press an item, then leave the menu or panel: inside them the same gesture paints instead;
  const armDrag = useCallback((column: AddColumnItem, event: React.PointerEvent) => {
    const item = event.currentTarget as HTMLElement
    const rect = item.getBoundingClientRect()
    armedRef.current = {
      column,
      x: event.clientX,
      y: event.clientY,
      origin: item.closest(ORIGIN_SELECTOR) as HTMLElement | null,
      immediate: !!(event.target as HTMLElement).closest?.('.hover-swap'),
      grab: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: rect.width,
      },
    }
  }, [])

  useEffect(() => {
    const isOverOrigin = (x: number, y: number, origin: HTMLElement | null) =>
      !!origin && document.elementsFromPoint(x, y).some((el) => origin.contains(el))

    const handleMove = (event: PointerEvent) => {
      const { clientX: x, clientY: y } = event
      if (dragRef.current) {
        setDrag((current) =>
          current ? { ...current, x, y, target: findDropTarget(x, y) } : current,
        )
        return
      }
      const armed = armedRef.current
      if (!armed) return
      if (Math.abs(x - armed.x) < DRAG_THRESHOLD && Math.abs(y - armed.y) < DRAG_THRESHOLD) return
      if (!armed.immediate && isOverOrigin(x, y, armed.origin)) return
      setDrag({ column: armed.column, x, y, grab: armed.grab, target: findDropTarget(x, y) })
    }

    const handleUp = () => {
      const current = dragRef.current
      armedRef.current = null
      if (!current) return
      suppressNextClick()
      if (current.target) {
        dropColumn(current.column.value, current.target)
        setMenuOpen(false)
      }
      setDrag(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelDrag()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', cancelDrag)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', cancelDrag)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropColumn, cancelDrag, setMenuOpen])

  // re-measured on every render: drag state updates each pointermove anyway
  const tableRect = drag
    ? document.querySelector(`[${TABLE_CONTAINER_ATTR}]`)?.getBoundingClientRect()
    : undefined

  const dragOverlay = drag
    ? createPortal(
        <>
          {tableRect && (
            <DropZone
              style={{
                left: tableRect.left,
                top: tableRect.top,
                width: tableRect.width,
                height: tableRect.height,
              }}
            />
          )}
          <Ghost
            style={{
              left: drag.x - drag.grab.x,
              top: drag.y - drag.grab.y,
              width: drag.grab.width,
            }}
            className={clsxTarget(drag)}
          >
            {drag.column.icon && <Icon icon={drag.column.icon} />}
            <span>{drag.column.label}</span>
          </Ghost>
          {drag.target && <ColumnDropLine style={drag.target.line} />}
        </>,
        document.body,
      )
    : null

  return { armDrag, cancelDrag, isDragging: !!drag, dragOverlay }
}

const clsxTarget = (drag: DragState) => (drag.target ? 'over-target' : '')

const suppressNextClick = () => {
  const block = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
  }
  window.addEventListener('click', block, true)
  setTimeout(() => window.removeEventListener('click', block, true), 0)
}

const DropZone = styled.div`
  position: fixed;
  box-sizing: border-box;
  z-index: 999;
  pointer-events: none;
  border-radius: 4px;
  background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
`

const Ghost = styled.div`
  position: fixed;
  box-sizing: border-box;
  z-index: 2000;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  opacity: 0.6;

  &.over-target {
    opacity: 1;
  }
`
