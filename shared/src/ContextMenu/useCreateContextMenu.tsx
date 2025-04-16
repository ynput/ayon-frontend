import { useCallback, useMemo, MouseEvent, RefObject } from 'react'
import ContextMenuItem, { ContextMenuItemProps } from './ContextMenuItem'
import { useContextMenu } from './ContextMenuContext'

// Extend the item type based on the ContextMenuItemProps
export interface ContextMenuItemType extends Omit<ContextMenuItemProps, 'contextMenuRef'> {
  items?: ContextMenuItemType[]
  template?: React.ReactNode
  [key: string]: any
}

// This is used to create submenus
const addTemplateToItems = (
  items: ContextMenuItemType[],
  ref: RefObject<{ hide: () => void }>,
): ContextMenuItemType[] => {
  return items.map((item) => {
    const newItem: ContextMenuItemType = {
      ...item,
      template: <ContextMenuItem key={item.label} contextMenuRef={ref} {...item} />,
    }
    if (newItem.items) {
      newItem.items = addTemplateToItems(newItem.items, ref)
    }
    return newItem
  })
}

type UseCreateContextReturn = [
  (e: MouseEvent, newItems?: ContextMenuItemType[]) => void,
  () => void,
  boolean,
  RefObject<{ hide: () => void }>,
]

export const useCreateContextMenu = (
  menuList: ContextMenuItemType[] = [],
): UseCreateContextReturn => {
  const { openContext, ref, isContextOpen, closeContext } = useContextMenu()

  const getModel = useCallback(
    (
      menuList: ContextMenuItemType[],
      ref: RefObject<{ hide: () => void }>,
    ): ContextMenuItemType[] => {
      return menuList.map((item) => ({
        template: <ContextMenuItem key={item.label} contextMenuRef={ref} {...item} />,
        items: item.items?.length ? addTemplateToItems(item.items, ref) : undefined,
      }))
    },
    [],
  )

  const model = useMemo(() => getModel(menuList, ref), [menuList, ref, getModel])

  const handleOpen = (e: MouseEvent, newItems?: ContextMenuItemType[]): void => {
    if (!e || !ref.current) return console.error('No ref or event passed to openContext')

    let newModel
    if (newItems) {
      newModel = getModel(newItems, ref)
    }

    e.preventDefault()
    openContext(e, newModel || model)
  }

  return [handleOpen, closeContext, isContextOpen, ref]
}

export default useCreateContextMenu
