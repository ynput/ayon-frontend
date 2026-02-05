import { FC, ReactNode, useCallback } from 'react'
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
const SCROLL_ZONE_SIZE = 120
const DEAD_ZONE_SIZE = 30
const MIN_SCROLL_SPEED = 5
const MAX_SCROLL_SPEED = 15
const DROP_THRESHOLD = DEAD_ZONE_SIZE + 20
const SPECIAL_COLUMNS = ['drag-handle', '__row_selection__']

const ColumnDndProvider: FC<ColumnDndProviderProps> = ({ children }) => {
  const { columnOrder, updateColumnOrder, columnPinning, columnSizing } = useColumnSettingsContext()
  const { restrictToSection, setDragPinnedState, clearDragPinnedState, activePinnedState } =
    useColumnDragRestriction({ columnPinning, columnSizing })

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, {}),
  )

  const pinnedColumns = columnPinning.left || []

  const getBoundaryX = useCallback(() => {
    const container = document.querySelector('[data-column-dnd-container]') as HTMLElement
    if (!container) return 0
    const pinnedWidth = pinnedColumns.reduce((w, id) => w + (columnSizing[id] || 150), 24)
    return container.getBoundingClientRect().left + pinnedWidth
  }, [pinnedColumns, columnSizing])

  const getFirstUnpinnedIndex = useCallback(() => {
    return columnOrder.findIndex((id) => !pinnedColumns.includes(id) && !SPECIAL_COLUMNS.includes(id))
  }, [columnOrder, pinnedColumns])

  const customCollisionDetection: CollisionDetection = useCallback(
    (args) => {
      const { active, droppableContainers, collisionRect } = args

      if (active?.data.current?.type !== 'column' || activePinnedState !== false || !collisionRect) {
        return closestCenter(args)
      }

      if (collisionRect.left <= getBoundaryX() + DROP_THRESHOLD) {
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

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'column') {
      setDragPinnedState(event.active.id as string)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    clearDragPinnedState()
    const { active, over } = event

    if (!active || active.data.current?.type !== 'column') return

    const activeId = active.id as string
    const isActivePinned = pinnedColumns.includes(activeId)

    if (!over || active.id === over.id) {
      // Try to place at first unpinned position if near boundary
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

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (event.active.data.current?.type !== 'column' || activePinnedState !== false) return

      const container = document.querySelector('[data-column-dnd-container]') as HTMLElement
      const draggedRect = event.active.rect.current.translated
      if (!container || !draggedRect) return

      const boundaryX = getBoundaryX()
      const scrollZoneStart = boundaryX + DEAD_ZONE_SIZE
      const scrollZoneEnd = scrollZoneStart + SCROLL_ZONE_SIZE
      const draggedLeftEdge = draggedRect.left

      if (draggedLeftEdge >= scrollZoneStart && draggedLeftEdge <= scrollZoneEnd) {
        const progress = 1 - (draggedLeftEdge - scrollZoneStart) / SCROLL_ZONE_SIZE
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
      onDragCancel={clearDragPinnedState}
      onDragMove={handleDragMove}
    >
      {children}
    </DndContext>
  )
}

export default ColumnDndProvider