import { FC, ReactNode, useCallback, useMemo, useRef } from 'react'
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
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useColumnSettingsContext } from '@shared/containers'
import { useColumnDragRestriction } from '../hooks/useColumnDragRestriction'

interface ColumnDndProviderProps {
  children: ReactNode
}

const SCROLL_SPEED = 60
const SCROLL_ZONE = 150
const DROP_THRESHOLD = 50
const SPECIAL_COLUMNS = ['drag-handle', '__row_selection__']

const ColumnDndProvider: FC<ColumnDndProviderProps> = ({ children }) => {
  const { columnOrder, updateColumnOrder, columnPinning, columnSizing } = useColumnSettingsContext()
  const { restrictToSection, setDragPinnedState, clearDragPinnedState, activePinnedState, setCachedBoundary } =
    useColumnDragRestriction({ columnPinning, columnSizing })

  const dragCache = useRef({
    cursorX: 0,
    container: null as HTMLElement | null,
    boundaryX: 0,
    containerRight: 0,
    scrollRAF: null as number | null,
    isScrolling: false,
    isColumnDrag: false,
    isPinnedDrag: null as boolean | null,
  })

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, {}),
  )

  const modifiers = useMemo(() => [restrictToSection], [restrictToSection])

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
      if (activePinnedState.current === null || activePinnedState.current) {
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
    [columnOrder, pinnedColumns],
  )

  const scrollLoop = useCallback(() => {
    try {
      const cache = dragCache.current

      if (!cache.container || !cache.isScrolling || !cache.isColumnDrag) {
        return
      }

      const leftScrollStart = cache.boundaryX + 20
      let scrollDelta = 0

      if (cache.isPinnedDrag === false && cache.cursorX <= leftScrollStart) {
        const progress = Math.min((leftScrollStart - cache.cursorX) / SCROLL_ZONE, 1)
        scrollDelta = -SCROLL_SPEED * (0.3 + progress * 0.7)
      } else if (cache.cursorX >= cache.containerRight - SCROLL_ZONE) {
        const progress = Math.min((cache.cursorX - (cache.containerRight - SCROLL_ZONE)) / SCROLL_ZONE, 1)
        scrollDelta = SCROLL_SPEED * (0.3 + progress * 0.7)
      }

      if (scrollDelta !== 0) {
        cache.container.scrollLeft += scrollDelta
      }

      cache.scrollRAF = requestAnimationFrame(scrollLoop)
    } catch (e) {
      console.error('[DND] scrollLoop error:', e)
      stopScrollLoop()
    }
  }, [])

  const startScrollLoop = useCallback(() => {
    if (dragCache.current.isScrolling) return
    dragCache.current.isScrolling = true
    dragCache.current.scrollRAF = requestAnimationFrame(scrollLoop)
  }, [scrollLoop])

  const stopScrollLoop = () => {
    dragCache.current.isScrolling = false
    if (dragCache.current.scrollRAF) {
      cancelAnimationFrame(dragCache.current.scrollRAF)
      dragCache.current.scrollRAF = null
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    dragCache.current.cursorX = e.clientX
  }, [])

  const clearDragCache = () => {
    stopScrollLoop()
    window.removeEventListener('mousemove', handleMouseMove)
    dragCache.current = {
      cursorX: 0,
      container: null,
      boundaryX: 0,
      containerRight: 0,
      scrollRAF: null,
      isScrolling: false,
      isColumnDrag: false,
      isPinnedDrag: null,
      }
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type !== 'column') return

    const container = document.querySelector('[data-column-dnd-container]') as HTMLElement
    const rect = container?.getBoundingClientRect()
    const isPinned = pinnedColumns.includes(event.active.id as string)

    dragCache.current.container = container
    dragCache.current.containerRight = rect?.right ?? 0
    dragCache.current.boundaryX = calculateBoundaryX()
    dragCache.current.isColumnDrag = true
    dragCache.current.isPinnedDrag = isPinned

    setDragPinnedState(event.active.id as string)
    setCachedBoundary(dragCache.current.boundaryX)
    window.addEventListener('mousemove', handleMouseMove)
    startScrollLoop()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    clearDragPinnedState()

    const { active, over } = event
    if (!active || !dragCache.current.isColumnDrag) {
      clearDragCache()
      return
    }

    const activeId = active.id as string
    const isActivePinned = pinnedColumns.includes(activeId)

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
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      modifiers={modifiers}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
    </DndContext>
  )
}

export default ColumnDndProvider
