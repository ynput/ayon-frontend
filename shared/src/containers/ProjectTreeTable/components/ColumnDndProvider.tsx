import { FC, ReactNode, useCallback, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useColumnSettingsContext } from '@shared/containers'
import { useColumnDragRestriction } from '../hooks/useColumnDragRestriction'

interface ColumnDndProviderProps {
  children: ReactNode
}

const SCROLL_SPEED = 25
const SCROLL_ZONE = 100
const DROP_THRESHOLD = 50
const SPECIAL_COLUMNS = ['drag-handle', '__row_selection__']

const ColumnDndProvider: FC<ColumnDndProviderProps> = ({ children }) => {
  const { columnOrder, updateColumnOrder, columnPinning, columnSizing } = useColumnSettingsContext()
  const { restrictToSection, setDragPinnedState, clearDragPinnedState, activePinnedState, setCachedBoundary } =
    useColumnDragRestriction({ columnPinning, columnSizing })

  // Cached values during drag
  const dragCache = useRef({
    cursorX: 0,
    container: null as HTMLElement | null,
    boundaryX: 0,
    containerLeft: 0,
    containerRight: 0,
    scrollRAF: null as number | null,
  })

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, {}),
  )

  const pinnedColumns = columnPinning.left || []

  const calculateBoundaryX = useCallback(() => {
    const container = dragCache.current.container
    if (!container) return 0
    const lastPinned = container.querySelector('th.last-pinned-left')
    if (lastPinned) return lastPinned.getBoundingClientRect().right
    const pinnedWidth = pinnedColumns.reduce((w, id) => w + (columnSizing[id] || 150), 24)
    return container.getBoundingClientRect().left + pinnedWidth
  }, [pinnedColumns, columnSizing])

  const getFirstUnpinnedIndex = useCallback(() => {
    return columnOrder.findIndex((id) => !pinnedColumns.includes(id) && !SPECIAL_COLUMNS.includes(id))
  }, [columnOrder, pinnedColumns])

  const customCollisionDetection: CollisionDetection = useCallback(
    (args) => {
      const { active, droppableContainers } = args
      if (active?.data.current?.type !== 'column' || activePinnedState !== false) {
        return closestCenter(args)
      }

      if (dragCache.current.cursorX <= dragCache.current.boundaryX + DROP_THRESHOLD) {
        const firstUnpinnedId = columnOrder.find(
          (id) => !pinnedColumns.includes(id) && !SPECIAL_COLUMNS.includes(id),
        )
        if (firstUnpinnedId && firstUnpinnedId !== active.id) {
          const container = droppableContainers.find((c) => c.id === firstUnpinnedId)
          if (container) return [{ id: firstUnpinnedId, data: { droppableContainer: container } }]
        }
      }
      return closestCenter(args)
    },
    [activePinnedState, columnOrder, pinnedColumns],
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    dragCache.current.cursorX = e.clientX
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type !== 'column') return

    const container = document.querySelector('[data-column-dnd-container]') as HTMLElement
    const rect = container?.getBoundingClientRect()

    dragCache.current.container = container
    dragCache.current.containerLeft = rect?.left ?? 0
    dragCache.current.containerRight = rect?.right ?? 0
    dragCache.current.boundaryX = calculateBoundaryX()

    setDragPinnedState(event.active.id as string)
    setCachedBoundary(dragCache.current.boundaryX)
    window.addEventListener('mousemove', handleMouseMove)
  }

  const clearDragCache = () => {
    if (dragCache.current.scrollRAF) cancelAnimationFrame(dragCache.current.scrollRAF)
    dragCache.current = { cursorX: 0, container: null, boundaryX: 0, containerLeft: 0, containerRight: 0, scrollRAF: null }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    clearDragPinnedState()
    window.removeEventListener('mousemove', handleMouseMove)

    const { active, over } = event
    if (!active || active.data.current?.type !== 'column') {
      clearDragCache()
      return
    }

    const activeId = active.id as string
    const isActivePinned = pinnedColumns.includes(activeId)

    // Handle drop at first unpinned position
    if ((!over || active.id === over.id) && !isActivePinned && event.active.rect.current.translated) {
      if (event.active.rect.current.translated.left <= dragCache.current.boundaryX + DROP_THRESHOLD) {
        const firstIdx = getFirstUnpinnedIndex()
        const oldIdx = columnOrder.indexOf(activeId)
        if (firstIdx !== -1 && oldIdx !== -1 && oldIdx !== firstIdx) {
          updateColumnOrder(arrayMove(columnOrder, oldIdx, firstIdx))
        }
      }
      clearDragCache()
      return
    }

    if (!over || isActivePinned !== pinnedColumns.includes(over.id as string)) {
      clearDragCache()
      return
    }

    const oldIdx = columnOrder.indexOf(activeId)
    const newIdx = columnOrder.indexOf(over.id as string)
    if (oldIdx !== -1 && newIdx !== -1) updateColumnOrder(arrayMove(columnOrder, oldIdx, newIdx))
    clearDragCache()
  }

  const handleDragCancel = () => {
    clearDragPinnedState()
    clearDragCache()
    window.removeEventListener('mousemove', handleMouseMove)
  }

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (event.active.data.current?.type !== 'column') return

      const { container, cursorX, boundaryX, containerLeft, containerRight } = dragCache.current
      if (!container) return

      if (dragCache.current.scrollRAF) cancelAnimationFrame(dragCache.current.scrollRAF)

      let scrollDelta = 0

      // Scroll left when cursor enters pinned section (unpinned columns only)
      if (activePinnedState === false && cursorX <= boundaryX) {
        const progress = Math.min((boundaryX - cursorX) / (boundaryX - containerLeft), 1)
        scrollDelta = -SCROLL_SPEED * (0.5 + progress * 0.5)
      }
      // Scroll right when cursor near right edge
      else if (cursorX >= containerRight - SCROLL_ZONE) {
        const progress = Math.min((cursorX - (containerRight - SCROLL_ZONE)) / SCROLL_ZONE, 1)
        scrollDelta = SCROLL_SPEED * (0.5 + progress * 0.5)
      }

      if (scrollDelta !== 0) {
        dragCache.current.scrollRAF = requestAnimationFrame(() => {
          container.scrollLeft += scrollDelta
        })
      }
    },
    [activePinnedState],
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      modifiers={[restrictToSection]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      onDragMove={handleDragMove}
    >
      {children}
    </DndContext>
  )
}

export default ColumnDndProvider
