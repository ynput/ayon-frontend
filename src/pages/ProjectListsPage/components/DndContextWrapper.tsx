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

interface DndContextWrapperProps {
  reorderListItem?: (active: Active, over: Over) => void
  children: (dndActiveId: UniqueIdentifier | null) => ReactNode
}

/**
 * DndContext wrapper that handles both row and column drag-and-drop.
 * Must be used inside a ColumnSettingsProvider.
 */
const DndContextWrapper: FC<DndContextWrapperProps> = ({ reorderListItem, children }) => {
  const { columnOrder, updateColumnOrder } = useColumnSettingsContext()
  const [dndActiveId, setDndActiveId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {}),
  )

  function handleDndDragStart(event: DragStartEvent) {
    setDndActiveId(event.active.id)
  }

  function handleDndDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      const dragType = active.data.current?.type

      if (dragType === 'column') {
        // Handle column reorder
        const activeId = active.id as string
        const overId = over.id as string
        const oldIndex = columnOrder.indexOf(activeId)
        const newIndex = columnOrder.indexOf(overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
          updateColumnOrder(newOrder)
        }
      } else if (reorderListItem) {
        // Handle row reorder
        reorderListItem(active as Active, over as Over)
      }
    }
    setDndActiveId(null)
  }

  function handleDndDragCancel() {
    setDndActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDndDragStart}
      onDragEnd={handleDndDragEnd}
      onDragCancel={handleDndDragCancel}
    >
      {children(dndActiveId)}
    </DndContext>
  )
}

export default DndContextWrapper