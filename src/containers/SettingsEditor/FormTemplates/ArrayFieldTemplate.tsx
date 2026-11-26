import { ArrayFieldTemplateProps, RJSFSchema } from '@rjsf/utils'
import { Button, Icon } from '@ynput/ayon-react-components'
import {
  closestCenter,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import styled from 'styled-components'
import { $Any } from '@types'
import {
  getListItemsPrefix,
  isGroupSchema,
  remapOpenListItems,
  reorderedIndex,
} from '../SettingsGroup/SettingsGroupHelpers'
import { AddFirstItemButton, AddItemButton, ArrayItemControls } from './ArrayFieldTemplate.styled'
import ArrayItemTemplate from './ArrayFieldItemTemplate'
import DraggableItem from './DraggableItem'
import { useListItemLayouts } from './useListItemLayouts'
import type { ListItemLayout } from './listItemLayout'
import { updateOpenItems } from './openItemsStore'

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

  /* rows of compact items fit the panel, their fields shrink instead */
  &.compact-rows {
    width: auto;
  }
`

// Below this distance the dragged item is still over its own slot
const SELF_DROP_DISTANCE = 8

const listCollisionDetection: CollisionDetection = (args) => {
  // a click on the handle, or a drop back where the item started, moves nothing. Past
  // that, only the other items count, so a tall open item moves past a short neighbour
  const ownSlot = args.droppableRects.get(args.active.id)
  if (ownSlot && args.collisionRect) {
    const moved = Math.abs(args.collisionRect.top - ownSlot.top)
    if (moved < SELF_DROP_DISTANCE) return [{ id: args.active.id }]
  }
  const droppableContainers = args.droppableContainers.filter(
    (container) => container.id !== args.active.id,
  )
  const collisions = pointerWithin({ ...args, droppableContainers })
  return collisions.length > 0 ? collisions : closestCenter({ ...args, droppableContainers })
}

const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const flatLayout = !!props.formContext?.flatLayout

  const onArrayChanged = (item: $Any) => () => {
    const parentId = item.children.props.idSchema.$id.split('_').slice(0, -1).join('_')
    const formContext = item.children._owner.memoizedProps.formContext
    const path = formContext.overrides[parentId].path
    formContext.onSetChangedKeys([{ path, isChanged: true }])
  }

  const canAddItems = props.canAdd && !props.schema?.disabled

  // classic layout: a list of compact objects reads as a table, the field labels show once,
  // above the first row. The flat layout draws its own rows (getListItemLayout)
  const { items: itemsRef } = props.schema
  const itemsSchema =
    !flatLayout && itemsRef && typeof itemsRef === 'object' && !Array.isArray(itemsRef)
      ? props.registry.schemaUtils.retrieveSchema(itemsRef as RJSFSchema)
      : undefined
  const compactRows = itemsSchema?.type === 'object' && itemsSchema?.layout === 'compact'

  // index of the added item, which takes the focus when it mounts so typing goes there
  const [itemToFocus, setItemToFocus] = useState<number | null>(null)
  const openItemsPrefix = getListItemsPrefix(props.formContext, props.idSchema.$id)
  const listRef = useRef<HTMLDivElement>(null)
  const layouts = useListItemLayouts(props, listRef)

  const onAddItem = () => {
    const id = props.idSchema.$id
    const formContext = props.formContext
    const path = formContext.overrides[id]?.path

    formContext.onSetChangedKeys([{ path, isChanged: true }])
    setItemToFocus(props.items.length)
    props.onAddClick()
    if (layouts?.itemsFold)
      updateOpenItems((prev) => [...prev, `${openItemsPrefix}${props.items.length}`])
  }

  // Shift+Enter in a field of an item saves it and starts the next item. Runs in the capture
  // phase, as text fields stop Enter from bubbling
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || !e.shiftKey || !canAddItems) return
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT') return
    const itemArrayId = target.closest('[data-array-item]')?.getAttribute('data-array-item')
    if (itemArrayId !== props.idSchema.$id) return
    e.preventDefault()
    e.stopPropagation()
    // text fields save on blur, so the item is added once that change is in the form data
    target.blur()
    setTimeout(onAddItem)
  }

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

  const items = props.items.map((item) => ({ ...item, id: item.index.toString() }))

  const handleDraggableEnd = (event: DragEndEvent) => {
    const item = items.find((item) => item.id === event.active.id)
    if (!item || !event.over) return

    const to = parseInt(event.over.id.toString())
    if (item.index === to) return

    onArrayChanged(item)()
    item.onReorderClick(item.index, to)()
    if (flatLayout)
      updateOpenItems((prev) =>
        remapOpenListItems(prev, openItemsPrefix, reorderedIndex(item.index, to)),
      )
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItemId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItemId(null)
    handleDraggableEnd(event)
  }

  const draggedItem = items.find((item) => item.id === draggedItemId)
  const overlayContextClass = clsx(
    'settings-group-body form-object-field-item array-dnd',
    !isGroupSchema(props.schema) && 'form-inline-field-widget',
  )

  return (
    <DndContextWrapper
      ref={listRef}
      className={clsx('array-dnd', compactRows && 'compact-rows')}
      onKeyDownCapture={handleKeyDown}
    >
      <DndContext
        collisionDetection={listCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggedItemId(null)}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((item, idx) => (
            <DraggableItem
              id={item.id}
              isVisible={item.id !== draggedItemId}
              flatLayout={flatLayout}
              layout={layouts?.items[item.index]}
              key={item.id}
              className={clsx(compactRows && idx === 0 && 'header-row')}
            >
              <FormArrayFieldWrapper
                onChange={onArrayChanged(item)}
                item={item}
                layout={layouts?.items[item.index]}
                arrayId={props.idSchema.$id}
                focusOnMount={idx === itemToFocus}
                onFocused={() => setItemToFocus(null)}
              />
            </DraggableItem>
          ))}
        </SortableContext>

        {canAddItems && (
          <ArrayItemControls className="array-add-controls">
            {flatLayout && !items.length ? (
              // an empty list is only this button, on its label's line (FieldTemplateHelpers)
              <AddFirstItemButton onClick={onAddItem} variant="text" className="array-add-first">
                Add item
                <Icon icon="add" />
              </AddFirstItemButton>
            ) : flatLayout ? (
              <AddItemButton
                onClick={onAddItem}
                icon="add"
                variant="text"
                className="array-add-button"
                aria-label="Add item"
                data-tooltip="Add item"
                data-shortcut="Shift+Enter"
              />
            ) : (
              <Button
                onClick={onAddItem}
                icon="add"
                data-tooltip="Add item"
                data-shortcut="Shift+Enter"
              />
            )}
          </ArrayItemControls>
        )}

        {draggedItem &&
          createPortal(
            <DragOverlay
              className={clsx('rjsf', flatLayout && 'settings-flat', compactRows && 'compact-rows')}
            >
              <div className={clsx(flatLayout && overlayContextClass)}>
                <DraggableItem
                  id={draggedItem.id}
                  flatLayout={flatLayout}
                  layout={layouts?.items[draggedItem.index]}
                  isOverlay
                >
                  <FormArrayFieldWrapper
                    item={draggedItem}
                    layout={layouts?.items[draggedItem.index]}
                  />
                </DraggableItem>
              </div>
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </DndContextWrapper>
  )
}

const FormArrayFieldWrapper = ({
  item,
  layout,
  onChange,
  arrayId,
  focusOnMount,
  onFocused,
}: {
  item: $Any
  layout?: ListItemLayout
  onChange?: () => void
  arrayId?: string
  focusOnMount?: boolean
  onFocused?: () => void
}) => {
  const dynProps = { ...item }
  delete dynProps.key
  const ref = useRef<HTMLDivElement>(null)

  // the new item takes focus once it's painted: focusing straight after the render makes the
  // browser restyle the whole sheet there and then, which the flat layout's :has() rules make
  // slow on a big addon. After the paint the styles are up to date and focusing costs nothing
  useEffect(() => {
    if (!focusOnMount) return
    let timer = 0
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        ref.current
          ?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select')
          ?.focus()
        onFocused?.()
      })
    })
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [focusOnMount, onFocused])

  return (
    <FormArrayField ref={ref} data-array-item={arrayId}>
      <ArrayItemTemplate onChange={onChange} layout={layout} {...dynProps} />
    </FormArrayField>
  )
}

export default ArrayFieldTemplate
