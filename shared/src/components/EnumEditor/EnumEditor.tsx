import { useState } from 'react'
import { createPortal } from 'react-dom'
import { uniqueId } from 'lodash'
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { Button } from '@ynput/ayon-react-components'

import DraggableEnumEditorItem, { DraggableEnumEditorItemProps } from './DraggableEnumEditorItem'
import * as Styled from './EnumEditor.styled'
import useDraggable from './hooks/useDraggable'
import { appendOrUpdateNumericSuffix } from './util'

export interface EnumEditorPt {
  item?: DraggableEnumEditorItemProps
  addButton?: Partial<React.ComponentProps<typeof Button>>
}

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

const mergeIncomingItems = (
  currentItems: AttributeData[],
  incomingItems: AttributeData[],
): AttributeData[] => {
  return incomingItems.map((incomingItem, index) => {
    const currentItem = currentItems[index]

    if (!currentItem) {
      return incomingItem
    }

    return {
      ...incomingItem,
      id: currentItem.id,
      isExpanded: currentItem.isExpanded,
      isLabelFocused: currentItem.isLabelFocused,
      isNewAttribute: currentItem.isNewAttribute,
    }
  })
}

interface EnumEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  values: NormalizedData[]
  onChange: (data: NormalizedData[]) => void
  onCommit?: (data: NormalizedData[]) => void
  pt?: EnumEditorPt
}
export const EnumEditor = ({ values, onChange, onCommit, pt, ...props }: EnumEditorProps) => {
  if (!values) {
    return null
  }

  const {
    items,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleCommitItem,
    handleDuplicateItem,
    handleDraggableEnd,
  } = useDraggable<AttributeData, NormalizedData>({
    creator,
    initialData: denormalize(values),
    onChange,
    onCommit,
    normalizer: normalize,
    mergeIncomingData: mergeIncomingItems,
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
      <Styled.EnumListWrapper {...props}>
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
                onCommit={handleCommitItem(idx)}
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
                {...pt?.item}
              />
            ))}
          </SortableContext>

          {createPortal(
            <DragOverlay style={{}}>
              {draggedItem && <DraggableEnumEditorItem item={draggedItem} {...pt?.item} />}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>

        <Button
          {...pt?.addButton}
          icon="add"
          variant="text"
          onClick={() => handleAddItem({ isNewAttribute: true })}
          className={pt?.addButton?.className}
          style={{ display: 'flex', justifyContent: 'start' }}
        >
          Add new item
        </Button>
      </Styled.EnumListWrapper>
    </>
  )
}
