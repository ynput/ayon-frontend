import { DragEndEvent } from '@dnd-kit/core';
import { uniqueId } from 'lodash'
import { useState } from 'react'

const useDraggableList = <T extends {id: string}>({ creator, initialData }: { creator: () => T; initialData: T[] }) => {
  console.log(creator, initialData)

  const [items, setItems] = useState<T[]>(initialData)

  const handleAddItem = () => {
    setItems([...items, { ...creator(), id: uniqueId() }])
  }
  const handleRemoveItem = (idx: number) => () => {
    setItems([...items.slice(0, idx), ...items.slice(idx + 1)])
  }

  const handleChangeItem = (idx: number) => (attr: keyof T, value: boolean | string | undefined) => {
    let updatedItem: T = {...items[idx] }
    // @ts-ignore
    updatedItem[attr] = value
    setItems([...items.slice(0, idx), updatedItem, ...items.slice(idx+ 1)])
  }

  const handleDuplicateItem = (idx: number) => {
    setItems([
      ...items.slice(0, idx + 1),
      { ...items[idx], id: uniqueId() },
      ...items.slice(idx + 1),
    ])
  }

  const handleDraggableEnd = (event: DragEndEvent) => {
    if (!event.over) {
      return
    }

    const activeItem = items.find((filterItem) => filterItem.id == event.active.id)
    const activeItemIndex = items.indexOf(activeItem!)
    const overItem = items.find((item) => item.id == event.over!.id)
    const overItemIndex = items.indexOf(overItem!)

    if (activeItemIndex < overItemIndex) {
      setItems([
        ...items.slice(0, activeItemIndex),
        ...items.slice(activeItemIndex + 1, overItemIndex + 1),
        activeItem!,
        ...items.slice(overItemIndex + 1),
      ])
    } else {
      setItems([
        ...items.slice(0, overItemIndex),
        activeItem!,
        ...items.slice(overItemIndex, activeItemIndex),
        ...items.slice(activeItemIndex + 1),
      ])
    }
  }

  return {
    items,
    handleAddItem,
    handleRemoveItem,
    handleChangeItem,
    handleDuplicateItem,
    handleDraggableEnd
  }
}

export default useDraggableList
