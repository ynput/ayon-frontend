import { uniqueId } from 'lodash'
import { Button } from '@ynput/ayon-react-components'

import useDraggableList from './hooks/useDraggableList'
import AttributeDropdownItem from './AttributeDropdownItem'
import * as Styled from './AttributeDropdown.styled'
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { $Any } from '@types'
import { useState } from 'react'
import { createPortal } from 'react-dom'

export type AttributeData = {
  id: string,
  isExpanded: boolean
  label: string
  value: string
  color?: string
  icon?: string
  isLabelFocused: boolean
  isIconEnabled: boolean
  isColorEnabled: boolean
}

export type NormalizedData = {
  label: string
  value: string
  color?: string
  icon?: string
}

const newItem = (): AttributeData => ({
  id: uniqueId(),
  isExpanded: true,
  label: '',
  value: '',
  isLabelFocused: true,
  isIconEnabled: false,
  isColorEnabled: false,
})
const normalize = (data: AttributeData[]): NormalizedData[] => {
  return data
    .filter((item) => item.label !== '' && item.value !== '')
    .map(({ label, value, icon, color, isIconEnabled, isColorEnabled }) => {
      return {
        label,
        value,
        icon: isIconEnabled ? icon : undefined,
        color: isColorEnabled ? color : undefined,
      }
    })
}

const denormalize = (data: NormalizedData[]): AttributeData[] => {
  return data.map(({ label, value, icon, color }) => {
    return ({
      id: uniqueId(),
      isExpanded: false,
      label,
      value,
      icon: icon,
      color: color,
      isLabelFocused: false,
      isIconEnabled: icon !== '' && icon !== null,
      isColorEnabled: color !== '' && color !== null,
    })
  })

}

const AttributeDropdown = ({ values, syncHandler }: { values: $Any; syncHandler: $Any }) => {
  const {
    items,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleDuplicateItem,
    handleDraggableEnd,
  } = useDraggableList<AttributeData, NormalizedData>({
    creator: newItem,
    initialData: denormalize(values),
    syncHandler,
    normalizer: normalize,
  })

  const [draggedItemId, setDraggedItemId] = useState<string | null>()
  let draggedItem
  if (draggedItemId) {
    draggedItem = items.find(item => item.id === draggedItemId)
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggedItemId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggedItemId(null)
    handleDraggableEnd(event)
  }

  return (
    <>
      <Styled.AttributeDropdownWrapper>
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, idx) => (
              <AttributeDropdownItem
                key={`AttributeDropdown_${item.id}`}
                item={item}
                isBeingDragged={item.id === draggedItemId}
                onChange={handleChangeItem(idx)}
                onRemove={handleRemoveItem(idx)}
                onDuplicate={() => handleDuplicateItem(idx, { isLabelFocused: true })}
              />
            ))}
          </SortableContext>

          {createPortal(
            <DragOverlay style={{}}>
              {draggedItem && (
                <AttributeDropdownItem
                  key={`AttributeDropdown_${draggedItem.id}`}
                  item={draggedItem}
                />
              )}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>

            <Button icon="add" variant="text" onClick={handleAddItem} style={{display: 'flex', justifyContent: 'start'}}>
              Add new item
            </Button>
      </Styled.AttributeDropdownWrapper>
    </>
  )
}

export default AttributeDropdown