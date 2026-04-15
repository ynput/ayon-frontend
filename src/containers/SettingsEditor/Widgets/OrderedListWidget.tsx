import { useState, useMemo, useRef, useEffect } from 'react'
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

const DropdownWrapper = styled.div`
  position: relative;
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

const DropdownList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  max-height: 300px;
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  margin-top: 2px;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 6px;
  padding: 6px 0;
`

const ActionButton = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-s);
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--md-sys-color-surface-container-highest);
    border-color: var(--md-sys-color-outline);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const selectAll = () => {
    const allValues = options.map((opt) => opt.value)
    onChange(allValues)
  }

  const deselectAll = () => {
    onChange([])
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <Container data-tooltip="">

      {/* Selected items with drag-and-drop */}
      {/* Dropdown to add items */}
      {unselectedItems.length > 0 && (
        <DropdownWrapper ref={dropdownRef}>
          <SearchInput
            ref={inputRef}
            placeholder="Application"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
          />
          {isDropdownOpen && (
            <DropdownList>
              {unselectedItems.map((opt) => (
                <ItemRow
                  key={opt.value}
                  onClick={() => {
                    addItem(opt.value)
                    setSearchQuery('')
                    inputRef.current?.focus()
                  }}
                >
                  <ItemLabel>{opt.label}</ItemLabel>
                </ItemRow>
              ))}
            </DropdownList>
          )}
        </DropdownWrapper>
      )}
      {value.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Selected ({value.length})</SectionLabel>
            <ButtonGroup>
              {unselectedItems.length > 0 && (
                <ActionButton
                  onClick={selectAll}
                  title="Select all available items"
                >
                  Select All
                </ActionButton>
              )}
              <ActionButton
                onClick={deselectAll}
                title="Deselect all items"
              >
                Deselect All
              </ActionButton>
            </ButtonGroup>
          </div>
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
