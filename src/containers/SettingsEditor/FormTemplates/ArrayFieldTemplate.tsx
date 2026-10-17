import { ArrayFieldTemplateProps } from '@rjsf/utils'
import { Button } from '@ynput/ayon-react-components'
import { useEffect, useRef, useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { createPortal } from 'react-dom'
import DraggableItem from './DraggableItem'
import ArrayItemTemplate from './ArrayFieldItemTemplate'
import styled from 'styled-components'
import { $Any } from '@types'
import { ArrayItemControls } from './ArrayFieldTemplate.styled'

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

  const containerRef = useRef<HTMLDivElement>(null)
  const focusAddedItem = useRef(false)

  const onAddItem = () => {
    const id = props.idSchema.$id
    const formContext = props.formContext
    const path = formContext.overrides[id]?.path

    formContext.onSetChangedKeys([{ path, isChanged: true }])
    focusAddedItem.current = true
    props.onAddClick()
  }

  const onAddItemRef = useRef(onAddItem)
  onAddItemRef.current = onAddItem

  // Shift+Enter in a field of an item saves it and starts the next item.
  // Runs in the capture phase, as text fields stop Enter from bubbling.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || !e.shiftKey || !props.canAdd || props.schema?.disabled) return
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT') return
    const itemArrayId = target.closest('[data-array-item]')?.getAttribute('data-array-item')
    if (itemArrayId !== props.idSchema.$id) return
    e.preventDefault()
    e.stopPropagation()
    // text fields save on blur, so the item is added once that change is in the form data
    target.blur()
    setTimeout(() => onAddItemRef.current())
  }

  // move the focus from the add button into the new item, so typing goes there
  useEffect(() => {
    if (!focusAddedItem.current) return
    focusAddedItem.current = false
    const itemElements = containerRef.current?.querySelectorAll(
      `[data-array-item="${props.idSchema.$id}"]`,
    )
    const added = itemElements?.[itemElements.length - 1]
    added?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select')?.focus()
  }, [props.items.length, props.idSchema.$id])

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
    <DndContextWrapper ref={containerRef} onKeyDownCapture={handleKeyDown}>
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item, idx) => (
          <DraggableItem id={item.id} isVisible={item.id !== draggedItemId} key={idx}>
            <FormArrayFieldWrapper
              onChange={onArrayChanged(item)}
              item={item}
              arrayId={props.idSchema.$id}
            />
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

const FormArrayFieldWrapper = ({
  item,
  onChange,
  arrayId,
}: {
  item: $Any
  onChange?: () => void
  arrayId?: string
}) => {
  const { key, ...dynProps } = item
  return (
    <FormArrayField data-array-item={arrayId}>
      <ArrayItemTemplate onChange={onChange} {...dynProps} />
    </FormArrayField>
  )
}

export default ArrayFieldTemplate
