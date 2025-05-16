import { useState } from 'react'
import { createPortal } from 'react-dom'
import { uniqueId } from 'lodash'
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { Button } from '@ynput/ayon-react-components'

import DraggableEnumEditorItem from './DraggableEnumEditorItem'
import * as Styled from './EnumEditor.styled'
import useDraggable from './hooks/useDraggable'
import { appendOrUpdateNumericSuffix } from './util'

export type AttributeData = {
  id: string
  isExpanded: boolean
  label: string
  value: string
  color?: string
  icon?: string
  isLabelFocused: boolean
  isNewAttribute: boolean
}

export type NormalizedData = {
  label: string
  value: string | number | boolean
  color?: string
  icon?: string
}

const creator = (): AttributeData => ({
  id: uniqueId(),
  isExpanded: true,
  label: '',
  value: '',
  isLabelFocused: true,
  isNewAttribute: false,
})

const normalize = (data: AttributeData[]): NormalizedData[] => {
  return data
    .filter((item) => item.label !== '' && item.value !== '')
    .map(({ label, value, icon, color }) => {
      let normalizedValue = value
      return {
        label,
        value: normalizedValue,
        icon: icon || undefined,
        color: color || undefined,
      }
    })
}

const denormalize = (data: NormalizedData[]): AttributeData[] => {
  return data.map(({ label, value, icon, color }) => {
    return {
      id: uniqueId(),
      isExpanded: false,
      label,
      value: value.toString(),
      icon: icon,
      color: color,
      isLabelFocused: false,
      isNewAttribute: false,
    }
  })
}

type Props = {
  values: NormalizedData[]
  onChange: (data: NormalizedData[]) => void
}
export const EnumEditor = ({ values, onChange }: Props) => {
  if (!values) {
    return null
  }

  const {
    items,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleDuplicateItem,
    handleDraggableEnd,
  } = useDraggable<AttributeData, NormalizedData>({
    creator,
    initialData: denormalize(values),
    onChange,
    normalizer: normalize,
  })

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItemId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItemId(null)
    handleDraggableEnd(event)
  }

  const [draggedItemId, setDraggedItemId] = useState<string | null>()
  let draggedItem
  if (draggedItemId) {
    draggedItem = items.find((item) => item.id === draggedItemId)
  }

  return (
    <>
      <Styled.EnumListWrapper>
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <DraggableEnumEditorItem
                key={`DraggableAttributeEnum_${item.id}`}
                item={item}
                isBeingDragged={item.id === draggedItemId}
                onChange={handleChangeItem(idx)}
                onRemove={handleRemoveItem(idx)}
                onDuplicate={() =>
                  handleDuplicateItem(idx, {
                    isLabelFocused: true,
                    isNewAttribute: true,
                    label: appendOrUpdateNumericSuffix(
                      items[idx].label,
                      items.map((e) => e.label),
                      ' ',
                    ),
                    value: appendOrUpdateNumericSuffix(
                      items[idx].value,
                      items.map((el) => el.value),
                      '-',
                    ),
                  })
                }
              />
            ))}
          </SortableContext>

          {createPortal(
            <DragOverlay style={{}}>
              {draggedItem && <DraggableEnumEditorItem item={draggedItem} />}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>

        <Button
          icon="add"
          variant="text"
          onClick={() => handleAddItem({ isNewAttribute: true })}
          style={{ display: 'flex', justifyContent: 'start' }}
        >
          Add new item
        </Button>
      </Styled.EnumListWrapper>
    </>
  )
}
