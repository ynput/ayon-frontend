import { ArrayFieldTemplateProps } from "@rjsf/utils"
import { Button } from '@ynput/ayon-react-components'
import { useState } from "react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core"
import { createPortal } from "react-dom"
import DraggableItem from "./DraggableItem"
import  ArrayItemTemplate from "./ArrayFieldItemTemplate"
import * as Styled from "./FormTemplates.styled"
import styled from "styled-components"
import { $Any } from "@types"

const FormArrayField = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
`

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {

  const onArrayChanged = (item: $Any) => () => {
    // @ts-ignore
    const parentId = item.children.props.idSchema.$id.split('_').slice(0, -1).join('_')
    // @ts-ignore
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
    const item = items.find(item => item.id === event.active.id)
    onArrayChanged(item)()
    if (item)  {
      item.onReorderClick(item.index, parseInt(event.over!.id.toString()))()
    }
  }

  const items = props.items.map((item) => ({ ...item, id: item.index.toString() }))

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItemId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItemId(null)
    handleDraggableEnd(event)
  }

  let draggedItem
  if (draggedItemId) {
    draggedItem = items.find((item) => item.id === draggedItemId)
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <Styled.ItemWrapper style={{ marginBottom: '4px', display: '' }}>
            <DraggableItem id={item.id} isVisible={item.id !== draggedItemId} key={item.key}>
              <FormArrayFieldWrapper onChange={onArrayChanged(item)} item={item} />
            </DraggableItem>
          </Styled.ItemWrapper>
        ))}
      </SortableContext>

      {props.canAdd && !props.schema?.disabled && (
        <Styled.ArrayItemControls>
          <Button onClick={onAddItem} icon="add" />
        </Styled.ArrayItemControls>
      )}

      {draggedItem && createPortal(
        //class needed to inherit styling defined in settings editor sass file
        <DragOverlay className="rjsf">
          <DraggableItem
            id={draggedItem!.id }
            isVisible={draggedItem.id === draggedItemId}
          >
            <FormArrayFieldWrapper item={draggedItem} />
          </DraggableItem>
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}

const FormArrayFieldWrapper = ({ item, onChange }: { item: $Any; onChange?: () => void }) => {
  return (
    <FormArrayField>
      <ArrayItemTemplate onChange={onChange} {...item} />
    </FormArrayField>
  )
}

export default ArrayFieldTemplate

  /*
const ArrayItemTemplate2 = (props: $Any) => {
  const parentSchema = props?.children?._owner?.memoizedProps?.schema || {}
  const itemName = props?.children?.props?.formData?.name
  let undeletable = false

  const children = props.children

  if (itemName && (parentSchema.requiredItems || []).includes(itemName)) {
    undeletable = true
    // TODO: Store this information elsewhere. since switching to RTK query
    // schema props are immutable! use form context maybe?

    //if (children.props.formData.name === itemName)
    //  children.props.schema.properties.name.fixedValue = itemName
  }
}
  */
