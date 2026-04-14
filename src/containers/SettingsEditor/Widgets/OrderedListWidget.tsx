import { useState, useMemo } from 'react'
import { Icon } from '@ynput/ayon-react-components'
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

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  background: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface);
  font-size: 13px;

  &:focus {
    outline: 1px solid var(--md-sys-color-primary);
    border-color: var(--md-sys-color-primary);
  }

  &::placeholder {
    color: var(--md-sys-color-outline);
  }
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  max-height: 300px;
`

const ItemRow = styled.div<{ $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  background: ${({ $isSelected }) =>
    $isSelected ? 'var(--md-sys-color-surface-container-high)' : 'transparent'};

  &:hover {
    background: var(--md-sys-color-surface-container-high);
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

// Sortable item for selected list
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
    <div ref={setNodeRef} style={style}>
      <ItemRow $isSelected>
        <DragHandle {...listeners} {...attributes} icon="drag_indicator" />
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
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const getLabel = (val: string) => {
    const opt = options.find((o) => o.value === val)
    return opt?.label || val
  }

  const addItem = (item: string) => {
    onChange([...value, item])
  }

  const removeItem = (item: string) => {
    onChange(value.filter((v) => v !== item))
  }

  // Drag handlers
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

  // Unselected items filtered by search
  const unselectedItems = useMemo(() => {
    return options.filter((opt) => {
      if (value.includes(opt.value)) return false
      if (searchQuery) {
        return opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })
  }, [options, value, searchQuery])

  const draggedLabel = draggedId ? getLabel(draggedId) : ''

  return (
    <Container>
      {/* Selected items with drag-and-drop */}
      {value.length > 0 && (
        <>
          <SectionLabel>Selected ({value.length})</SectionLabel>
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

      {/* Available items */}
      {unselectedItems.length > 0 && (
        <>
          <SectionLabel>Available</SectionLabel>
          {options.length > 5 && (
            <div style={{ padding: '0 4px 4px' }}>
              <SearchInput
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          <ItemList>
            {unselectedItems.map((opt) => (
              <ItemRow key={opt.value} onClick={() => addItem(opt.value)}>
                <ActionIcon icon="add" style={{ opacity: 0.7 }} />
                <ItemLabel>{opt.label}</ItemLabel>
              </ItemRow>
            ))}
          </ItemList>
        </>
      )}

      {options.length === 0 && <SectionLabel>No options available</SectionLabel>}
    </Container>
  )
}

export default OrderedListWidget