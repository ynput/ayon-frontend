import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDndContext } from '@dnd-kit/core'
import { ColumnDropLine } from './ColumnDropIndicator.styled'
import { getColumnDropLinePosition } from './ColumnDropIndicatorHelpers'

export const COLUMN_HEADER_SELECTOR = 'th[data-column-id]'

export type LinePosition = { left: number; top: number; height: number }

// reordering a column in the table marks the drop with the same line as dragging one in from a menu
export const TableColumnDropIndicator = () => {
  const { active, over } = useDndContext()
  const activeId = active?.data?.current?.type === 'column' ? String(active.id) : null
  const overId = over ? String(over.id) : null
  const [position, setPosition] = useState<LinePosition | null>(null)

  useEffect(() => {
    if (!activeId || !overId || activeId === overId) {
      setPosition(null)
      return
    }

    let frame = 0
    const measure = () => {
      const headers = Array.from(
        document.querySelectorAll<HTMLElement>(COLUMN_HEADER_SELECTOR),
      )
      const header = headers.find((el) => el.dataset.columnId === overId)
      if (header) {
        const activeIndex = headers.findIndex((el) => el.dataset.columnId === activeId)
        const overIndex = headers.indexOf(header)
        const next = getColumnDropLinePosition(header, activeIndex < overIndex ? 'right' : 'left')
        setPosition((current) =>
          current &&
          current.left === next.left &&
          current.top === next.top &&
          current.height === next.height
            ? current
            : next,
        )
      }
      // the table auto-scrolls horizontally while dragging, so the target keeps moving
      frame = requestAnimationFrame(measure)
    }
    measure()

    return () => cancelAnimationFrame(frame)
  }, [activeId, overId])

  if (!position) return null

  return createPortal(<ColumnDropLine style={position} />, document.body)
}
