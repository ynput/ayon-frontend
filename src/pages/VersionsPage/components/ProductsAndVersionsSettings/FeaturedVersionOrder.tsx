import { FC, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// options and default order
export const TYPE_OPTIONS = [
  { value: 'hero', label: 'Hero', short: 'Hero' },
  { value: 'latestDone', label: 'Latest Done', short: 'Done ' },
  { value: 'latest', label: 'Latest', short: 'Latest' },
]

interface FeaturedVersionOrderProps {
  value: string[]
  onChange: (value: string[]) => void
}

interface SortableItemProps {
  id: string
  label: string
}

const SortableItem: FC<SortableItemProps> = ({ id, label }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <SortableItemWrapper
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'dragging' : ''}
      {...attributes}
      {...listeners}
    >
      <ItemContent>
        <DragHandle>
          <Icon icon="drag_indicator" />
        </DragHandle>
        <ItemLabel>{label}</ItemLabel>
      </ItemContent>
    </SortableItemWrapper>
  )
}

const FeaturedVersionOrder: FC<FeaturedVersionOrderProps> = ({ value, onChange }) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  // Sort TYPE_OPTIONS based on the value array order
  const orderedOptions = useMemo(() => {
    const optionsCopy = [...TYPE_OPTIONS]

    if (value.length > 0) {
      optionsCopy.sort((a, b) => {
        const indexA = value.indexOf(a.value)
        const indexB = value.indexOf(b.value)

        // If item is not in value array, place at end
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })
    }

    return optionsCopy
  }, [value])

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = orderedOptions.findIndex((option) => option.value === active.id)
      const newIndex = orderedOptions.findIndex((option) => option.value === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedOptions, oldIndex, newIndex)
        const newValue = newOrder.map((option) => option.value)
        onChange(newValue)
      }
    }

    setActiveId(null)
  }

  // Find the active option for the drag overlay
  const activeOption = activeId ? TYPE_OPTIONS.find((option) => option.value === activeId) : null

  return (
    <Container>
      <InfoHeader>
        <span className="label">Product's featured version priority</span>
        <Icon
          icon="info"
          data-tooltip={
            'Select which version should be displayed in the product. If the chosen version type is not available, the next type in the list will be used.'
          }
          data-tooltip-delay={0}
        />
      </InfoHeader>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedOptions.map((option) => option.value)}
          strategy={verticalListSortingStrategy}
        >
          <ItemsList>
            {orderedOptions.map((option) => (
              <SortableItem key={option.value} id={option.value} label={option.label} />
            ))}
          </ItemsList>
        </SortableContext>

        <DragOverlay>
          {activeOption && (
            <ItemContent className="overlay">
              <DragHandle>
                <Icon icon="drag_indicator" />
              </DragHandle>
              <ItemLabel>{activeOption.label}</ItemLabel>
            </ItemContent>
          )}
        </DragOverlay>
      </DndContext>
    </Container>
  )
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
`

const SortableItemWrapper = styled.div`
  &.dragging {
    opacity: 0;
  }
`

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-m);
  padding: 2px;
  padding-left: 8px;
  height: 32px;
  cursor: grab;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }

  &.overlay {
    box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.1);
    background-color: var(--md-sys-color-surface-container-high);
  }

  &:active {
    cursor: grabbing;
  }
`

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  color: var(--md-sys-color-outline);
`

const ItemLabel = styled.span`
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
`

const InfoHeader = styled.div`
  color: var(--md-sys-color-outline);
  display: flex;
  align-items: center;
  padding: 4px 0;
  width: 100%;

  .label {
    font-weight: 500;
    margin-right: 8px;
  }
  .icon {
    cursor: pointer;
  }
`

export default FeaturedVersionOrder
