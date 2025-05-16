import { DragEndEvent } from '@dnd-kit/core';
import { uniqueId } from 'lodash'
import { useState } from 'react'

const useDraggable = <T extends { id: string }, U>({
  creator,
  initialData,
  onChange,
  normalizer,
}: {
  creator: () => T
  initialData: T[]
  onChange: (data: U[]) => void
  normalizer: (data: T[]) => U[]
}) => {
  const [items, setItems] = useState<T[]>(initialData)

  const updateAndSync = (data: T[]) => {
    onChange(normalizer(data))
    setItems(data)
  }

  const handleAddItem = (overrides: Partial<T>) => {
    updateAndSync([...items, { ...creator(), ...overrides, id: uniqueId() }])
  }

  const handleRemoveItem = (idx: number) => () => {
    updateAndSync([...items.slice(0, idx), ...items.slice(idx + 1)])
  }

  const handleChangeItem =
    (idx: number) => (attrs: (keyof T)[], values: (boolean | string | undefined)[]) => {
      let updatedItem: T = { ...items[idx] }
      //@ts-ignore
      attrs.map((attr, index) => (updatedItem[attr] = values[index]))
      updateAndSync([...items.slice(0, idx), updatedItem, ...items.slice(idx + 1)])
    }

  const handleDuplicateItem = (idx: number, overrides: Partial<T>) => {
    updateAndSync([
      ...items.slice(0, idx + 1),
      { ...items[idx], id: uniqueId(), ...overrides },
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
      updateAndSync([
        ...items.slice(0, activeItemIndex),
        ...items.slice(activeItemIndex + 1, overItemIndex + 1),
        activeItem!,
        ...items.slice(overItemIndex + 1),
      ])
    } else {
      updateAndSync([
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
    handleDraggableEnd,
  }
}

export default useDraggable
