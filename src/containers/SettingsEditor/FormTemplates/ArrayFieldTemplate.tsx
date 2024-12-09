import { ArrayFieldTemplateProps } from '@rjsf/utils'
import { Button } from '@ynput/ayon-react-components'
import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import DraggableItem from './DraggableItem'
import ArrayItemTemplate from './ArrayFieldItemTemplate'
import styled from 'styled-components'
import { $Any } from '@types'

export const ArrayItemControls = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 5px;

  button {
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }
`

const FormArrayField = styled.div`
  flex-grow: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

const DndContextWrapper = styled.div`
  min-width: 100%;
  width: max-content;
`

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const onArrayChanged = (item: $Any) => () => {
    const parentId = item.children.props.idSchema.$id.split('_').slice(0, -1).join('_')
    const formContext = item.children._owner.memoizedProps.formContext
    const path = formContext.overrides[parentId].path
    formContext.onSetChangedKeys([{ path, isChanged: true }])
  }

  const onAddItem = () => {
    const id = props.idSchema.$id
    const formContext = props.formContext
    const path = formContext.overrides[id]?.path

    formContext.onSetChangedKeys([{ path, isChanged: true }])
    props.onAddClick()
  }

  const [draggedItemId, setDraggedItemId] = useState<string | null>()

  const handleDraggableEnd = (event: DragEndEvent) => {
    const item = items.find((item) => item.id === event.active.id)
    if (!item) {
      return
    }
    onArrayChanged(item)()
    item.onReorderClick(item.index, parseInt(event.over!.id.toString()))()
  }

  const items = props.items.map((item) => ({ ...item, id: item.index.toString() }))

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItemId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItemId(null)
    handleDraggableEnd(event)
  }

  const draggedItem = items.find((item) => item.id === draggedItemId)

  return (
    <DndContextWrapper>
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item, idx) => (
          <DraggableItem id={item.id} isVisible={item.id !== draggedItemId} key={idx}>
            <FormArrayFieldWrapper onChange={onArrayChanged(item)} item={item} />
          </DraggableItem>
        ))}
      </SortableContext>

      {props.canAdd && !props.schema?.disabled && (
        <ArrayItemControls>
          <Button onClick={onAddItem} icon="add" />
        </ArrayItemControls>
      )}

      {draggedItem &&
        createPortal(
          //class needed to inherit styling defined in settings editor sass file
          <DragOverlay className="rjsf">
            <DraggableItem id={draggedItem!.id} isOverlay>
              <FormArrayFieldWrapper item={draggedItem} />
            </DraggableItem>
          </DragOverlay>,
          document.body,
        )}
    </DndContext>
  </DndContextWrapper>
  )
}

const FormArrayFieldWrapper = ({ item, onChange }: { item: $Any; onChange?: () => void }) => {
  const { key, ...dynProps } = item
  return (
    <FormArrayField>
      <ArrayItemTemplate onChange={onChange} {...dynProps} />
    </FormArrayField>
  )
}

export default ArrayFieldTemplate
