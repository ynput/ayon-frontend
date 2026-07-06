import { useState } from 'react'
import { Button, Dialog, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

const StyledDialog = styled(Dialog)`
  && {
    max-height: 85vh;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 320px;
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  cursor: pointer;

  &:hover {
    background: var(--md-sys-color-surface-container-hover);
  }

  &.dragging {
    visibility: hidden;
  }
`

const DragHandle = styled(Icon)`
  cursor: grab;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`

const ItemLabel = styled.span`
  flex: 1;
  font-size: 13px;
  user-select: none;
`

const ActionIcon = styled(Icon)`
  cursor: pointer;
  opacity: 0.5;
  font-size: 18px;
  &:hover {
    opacity: 1;
  }
`

const SortableItem = ({
  id,
  label,
  onRemove,
  isDragging,
}: {
  id: string
  label: string
  isDragging: boolean
  onRemove: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    animateLayoutChanges: () => false,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ItemRow className={clsx({ dragging: isDragging })}>
        <DragHandle {...listeners} icon="drag_indicator" />
        <ItemLabel>{label}</ItemLabel>
        <ActionIcon
          icon="close"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            onRemove()
          }}
        />
      </ItemRow>
    </div>
  )
}

export interface OrderSelectionDialogProps {
  value: string[]
  options: { label: string; value: string }[]
  onSubmit: (value: string[] | null) => void
}

const OrderSelectionDialog = ({ value, options, onSubmit }: OrderSelectionDialogProps) => {
  const [order, setOrder] = useState<string[]>(value)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const getLabel = (val: string) => options.find((o) => o.value === val)?.label || val

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = order.indexOf(active.id as string)
    const newIndex = order.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    setOrder(arrayMove(order, oldIndex, newIndex))
  }

  const removeItem = (item: string) => {
    setOrder(order.filter((v) => v !== item))
  }

  const draggedLabel = draggedId ? getLabel(draggedId) : ''

  const footer = (
    <>
      <Button onClick={() => onSubmit(null)} label="Cancel" variant="text" />
      <Button onClick={() => onSubmit(order)} label="Confirm" />
    </>
  )

  return (
    <StyledDialog
      header="Selection order"
      footer={footer}
      isOpen
      size="sm"
      onClose={() => onSubmit(null)}
    >
      <List>
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {order.map((item) => (
              <SortableItem
                key={item}
                id={item}
                label={getLabel(item)}
                onRemove={() => removeItem(item)}
                isDragging={draggedId === item}
              />
            ))}
          </SortableContext>
          {draggedId &&
            createPortal(
              <DragOverlay>
                <ItemRow
                  style={{
                    background: 'var(--md-sys-color-surface-container-high)',
                    boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <DragHandle icon="drag_indicator" />
                  <ItemLabel>{draggedLabel}</ItemLabel>
                  <ActionIcon icon="close" style={{ opacity: 0.3 }} />
                </ItemRow>
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </List>
    </StyledDialog>
  )
}

export default OrderSelectionDialog
