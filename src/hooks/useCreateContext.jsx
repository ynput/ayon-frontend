import { useCallback, useMemo } from 'react'
import ContextMenuItem from '@components/ContextMenu/ContextMenuItem'
import { useContextMenu } from '@context/contextMenuContext'

// This is used to create submenus
const addTemplateToItems = (items, ref) => {
  return items.map((item) => {
    const newItem = {
      ...item,
      template: <ContextMenuItem key={item.label} contextMenuRef={ref} {...item} />,
    }
    if (newItem.items) {
      newItem.items = addTemplateToItems(newItem.items)
    }
    return newItem
  })
}

const useCreateContext = (menuList = []) => {
  const { openContext, ref, isContextOpen, closeContext } = useContextMenu()

  const getModel = useCallback(
    (menuList, ref) => {
      return menuList.map((item) => ({
        template: <ContextMenuItem key={item.label} contextMenuRef={ref} {...item} />,
        items: item.items?.length ? addTemplateToItems(item.items, ref) : undefined,
      }))
    },
    [addTemplateToItems],
  )

  const model = useMemo(() => getModel(menuList, ref), [menuList, ref])

  const handleOpen = (e, newItems) => {
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

export default useCreateContext
