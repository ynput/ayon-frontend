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

// Constants
const MIN_SCROLL_SPEED = 5
const MAX_SCROLL_SPEED = 15
const DROP_THRESHOLD = 50 // Distance from boundary for dropping at first position
const SPECIAL_COLUMNS = ['drag-handle', '__row_selection__']

const ColumnDndProvider: FC<ColumnDndProviderProps> = ({ children }) => {
  const { columnOrder, updateColumnOrder, columnPinning, columnSizing } = useColumnSettingsContext()
  const { restrictToSection, setDragPinnedState, clearDragPinnedState, activePinnedState } =
    useColumnDragRestriction({ columnPinning, columnSizing })

  const cursorXRef = useRef<number>(0)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, {}),
  )

  const pinnedColumns = columnPinning.left || []

  const getBoundaryX = useCallback(() => {
    const container = document.querySelector('[data-column-dnd-container]') as HTMLElement
    if (!container) return 0
    const lastPinnedHeader = container.querySelector('th.last-pinned-left')
    if (lastPinnedHeader) {
      return lastPinnedHeader.getBoundingClientRect().right
    }
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

      // Use actual cursor position to detect if user wants to drop at first position
      const cursorX = cursorXRef.current
      const boundaryX = getBoundaryX()

      if (cursorX <= boundaryX + DROP_THRESHOLD) {
        const firstUnpinnedId = columnOrder.find(
          (id) => !pinnedColumns.includes(id) && !SPECIAL_COLUMNS.includes(id),
        )
        if (firstUnpinnedId && firstUnpinnedId !== active.id) {
          const container = droppableContainers.find((c) => c.id === firstUnpinnedId)
          if (container) {
            return [{ id: firstUnpinnedId, data: { droppableContainer: container } }]
          }
        }
      }

      return closestCenter(args)
    },
    [activePinnedState, columnOrder, pinnedColumns, getBoundaryX],
  )

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorXRef.current = e.clientX
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'column') {
      setDragPinnedState(event.active.id as string)
      window.addEventListener('mousemove', handleMouseMove)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    clearDragPinnedState()
    window.removeEventListener('mousemove', handleMouseMove)

    const { active, over } = event

    if (!active || active.data.current?.type !== 'column') return

    const activeId = active.id as string
    const isActivePinned = pinnedColumns.includes(activeId)

    if (!over || active.id === over.id) {
      if (!isActivePinned && event.active.rect.current.translated) {
        const draggedLeftEdge = event.active.rect.current.translated.left
        if (draggedLeftEdge <= getBoundaryX() + DROP_THRESHOLD) {
          const firstIdx = getFirstUnpinnedIndex()
          const oldIdx = columnOrder.indexOf(activeId)
          if (firstIdx !== -1 && oldIdx !== -1 && oldIdx !== firstIdx) {
            updateColumnOrder(arrayMove(columnOrder, oldIdx, firstIdx))
          }
        }
      }
      return
    }

    const overId = over.id as string
    if (isActivePinned !== pinnedColumns.includes(overId)) return

    const oldIdx = columnOrder.indexOf(activeId)
    const newIdx = columnOrder.indexOf(overId)
    if (oldIdx !== -1 && newIdx !== -1) {
      updateColumnOrder(arrayMove(columnOrder, oldIdx, newIdx))
    }
  }

  const handleDragCancel = () => {
    clearDragPinnedState()
    window.removeEventListener('mousemove', handleMouseMove)
  }

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (event.active.data.current?.type !== 'column' || activePinnedState !== false) return

      const container = document.querySelector('[data-column-dnd-container]') as HTMLElement
      if (!container) return

      const cursorX = cursorXRef.current
      const containerRect = container.getBoundingClientRect()
    const boundaryX = getBoundaryX()
      const pinnedStart = containerRect.left

      if (cursorX <= boundaryX) {
        const pinnedWidth = boundaryX - pinnedStart
        const distanceIntoPinned = boundaryX - cursorX
        const progress = Math.min(distanceIntoPinned / pinnedWidth, 1)
        const speed = MIN_SCROLL_SPEED + (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED) * progress
        container.scrollLeft -= speed
      }
    },
    [activePinnedState, getBoundaryX],
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
