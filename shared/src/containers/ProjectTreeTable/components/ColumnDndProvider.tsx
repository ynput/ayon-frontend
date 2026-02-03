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
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useColumnSettingsContext } from '@shared/containers'

interface ColumnDndProviderProps {
  children: ReactNode
}

/**
 * A DndContext provider that handles column drag-and-drop reordering.
 * Must be used inside a ColumnSettingsProvider.
 */
const ColumnDndProvider: FC<ColumnDndProviderProps> = ({ children }) => {
  const { columnOrder, updateColumnOrder } = useColumnSettingsContext()
  const [, setDndActiveId] = useState<string | null>(null)

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
    setDndActiveId(event.active.id as string)
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
      }
      // Row drags are not handled here - this provider is only for columns
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
      {children}
    </DndContext>
  )
}

export default ColumnDndProvider
