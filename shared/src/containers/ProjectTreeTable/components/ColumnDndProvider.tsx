import { FC, ReactNode } from 'react'
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
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useColumnSettingsContext } from '@shared/containers'
import { useColumnDragRestriction } from '../hooks/useColumnDragRestriction'

interface ColumnDndProviderProps {
  children: ReactNode
}

/**
 * A DndContext provider that handles column drag-and-drop reordering.
 * Must be used inside a ColumnSettingsProvider.
 */
const ColumnDndProvider: FC<ColumnDndProviderProps> = ({ children }) => {
  const { columnOrder, updateColumnOrder, columnPinning, columnSizing } = useColumnSettingsContext()

  const { restrictToSection, setDragPinnedState, clearDragPinnedState } = useColumnDragRestriction({
    columnPinning,
    columnSizing,
  })

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, {}),
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type !== 'column') return
    setDragPinnedState(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    clearDragPinnedState()

    const { active, over } = event
    if (!active || !over || active.id === over.id) return
    if (active.data.current?.type !== 'column') return

    const activeId = active.id as string
    const overId = over.id as string
    const pinnedColumns = columnPinning.left || []

    // Don't allow reordering across pinned/unpinned boundaries
    if (pinnedColumns.includes(activeId) !== pinnedColumns.includes(overId)) return

    const oldIndex = columnOrder.indexOf(activeId)
    const newIndex = columnOrder.indexOf(overId)
    if (oldIndex !== -1 && newIndex !== -1) {
      updateColumnOrder(arrayMove(columnOrder, oldIndex, newIndex))
    }
  }

  const handleDragCancel = () => clearDragPinnedState()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToSection]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children}
    </DndContext>
  )
}

export default ColumnDndProvider