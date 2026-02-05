import { FC, ReactNode, useState } from 'react'
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
  type UniqueIdentifier,
  type Active,
  type Over,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import { useColumnDragRestriction } from '@shared/containers/ProjectTreeTable/hooks/useColumnDragRestriction'

interface DndContextWrapperProps {
  reorderListItem?: (active: Active, over: Over) => void
  children: (dndActiveId: UniqueIdentifier | null) => ReactNode
}

/**
 * DndContext wrapper that handles both row and column drag-and-drop.
 * Must be used inside a ColumnSettingsProvider.
 */
const DndContextWrapper: FC<DndContextWrapperProps> = ({ reorderListItem, children }) => {
  const { columnOrder, updateColumnOrder, columnPinning, columnSizing } = useColumnSettingsContext()
  const [dndActiveId, setDndActiveId] = useState<UniqueIdentifier | null>(null)

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
    setDndActiveId(event.active.id)
    if (event.active.data.current?.type === 'column') {
      setDragPinnedState(event.active.id as string)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDndActiveId(null)
    clearDragPinnedState()

    if (!active || !over || active.id === over.id) return

    if (active.data.current?.type === 'column') {
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
    } else if (reorderListItem) {
      reorderListItem(active as Active, over as Over)
    }
  }

  const handleDragCancel = () => {
    setDndActiveId(null)
    clearDragPinnedState()
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToSection]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children(dndActiveId)}
    </DndContext>
  )
}

export default DndContextWrapper