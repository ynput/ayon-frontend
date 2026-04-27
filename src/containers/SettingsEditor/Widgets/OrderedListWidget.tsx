import { useState } from 'react'
import { Icon, Dropdown } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
`

const ItemRow = styled.div<{ $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  cursor: pointer;

  &:hover {
    background: var(--md-sys-color-surface-container-highest);
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

const SectionLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  color: var(--md-sys-color-outline);
  padding: 6px 8px 2px;
  letter-spacing: 0.5px;
`

const SortableItem = ({
  id,
  label,
  onRemove,
}: {
  id: string
  label: string
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
      <ItemRow $isSelected>
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

export interface OrderedListWidgetProps {
  value: string[]
  options: { label: string; value: string }[]
  onChange: (value: string[]) => void
}

const OrderedListWidget = ({ value, options, onChange }: OrderedListWidgetProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const getLabel = (val: string) => {
    const opt = options.find((o) => o.value === val)
    return opt?.label || val
  }

  const handleSelectionChange = (newSelection: string[]) => {
    // Preserve order of already-selected items, append new ones at end
    const kept = value.filter((v) => newSelection.includes(v))
    const added = newSelection.filter((v) => !value.includes(v))
    onChange([...kept, ...added])
  }

  const removeItem = (item: string) => {
    onChange(value.filter((v) => v !== item))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = value.indexOf(active.id as string)
    const newIndex = value.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    onChange(arrayMove(value, oldIndex, newIndex))
  }

  const draggedLabel = draggedId ? getLabel(draggedId) : ''

  return (
    <Container data-tooltip="">
      <Dropdown
        widthExpand
        options={options}
        value={value}
        onSelectionChange={handleSelectionChange}
        multiSelect
        placeholder="Select applications"
      />

      {value.length > 0 && (
        <>
          <SectionLabel>Order selection</SectionLabel>
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={value} strategy={verticalListSortingStrategy}>
              {value.map((item) => (
                <SortableItem
                  key={item}
                  id={item}
                  label={getLabel(item)}
                  onRemove={() => removeItem(item)}
                />
              ))}
            </SortableContext>
            {draggedId &&
              createPortal(
                <DragOverlay>
                  <ItemRow
                    $isSelected
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
        </>
      )}

      {options.length === 0 && <SectionLabel>No options available</SectionLabel>}
    </Container>
  )
}

export default OrderedListWidget
