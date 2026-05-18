import { useState } from 'react'
import {
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ColumnOrderState, Row, RowData } from '@tanstack/react-table'

interface UseTableDndOptions<TData extends RowData> {
  rows: Row<TData>[]
  onReorderRows?: (startIndex: number, endIndex: number) => void
  setColumnOrder: (updater: (prev: ColumnOrderState) => ColumnOrderState) => void
  onColumnOrderChange?: (order: ColumnOrderState) => void
}

export function useTableDnd<TData extends RowData>({
  rows,
  onReorderRows,
  setColumnOrder,
  onColumnOrderChange,
}: UseTableDndOptions<TData>) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleColumnDragStart = (event: DragStartEvent) => {
    setActiveColumnId(event.active.id as string)
  }

  const handleColumnDragEnd = (event: DragEndEvent) => {
    setActiveColumnId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      setColumnOrder((prevOrder) => {
        const oldIndex = prevOrder.indexOf(active.id as string)
        const newIndex = prevOrder.indexOf(over.id as string)
        const newOrder = arrayMove(prevOrder, oldIndex, newIndex)
        onColumnOrderChange?.(newOrder)
        return newOrder
      })
    }
  }

  const handleColumnDragCancel = () => setActiveColumnId(null)

  const handleRowDragStart = (event: DragStartEvent) => {
    setActiveRowId(event.active.id as string)
  }

  const handleRowDragEnd = (event: DragEndEvent) => {
    setActiveRowId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((row) => row.id === active.id)
      const newIndex = rows.findIndex((row) => row.id === over.id)
      onReorderRows?.(oldIndex, newIndex)
    }
  }

  const handleRowDragCancel = () => setActiveRowId(null)

  return {
    sensors,
    activeRowId,
    activeColumnId,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragCancel,
    handleRowDragStart,
    handleRowDragEnd,
    handleRowDragCancel,
  }
}
