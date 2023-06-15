import { useMemo } from 'react'
import ContextMenuItem from '../components/ContextMenuItem'
import { useContextMenu } from '../context/contextMenuContext'

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

const useCreateContext = (menuList) => {
  const { openContext, ref } = useContextMenu()

  const model = useMemo(
    () =>
      menuList.map((item) => ({
        template: <ContextMenuItem key={item.label} contextMenuRef={ref} {...item} />,
        items: item.items ? addTemplateToItems(item.items, ref) : undefined,
      })),
    [menuList],
  )

  const handleOpen = (e) => {
    if (!e || !ref.current) return console.error('No ref or event passed to openContext')

    e.preventDefault()
    openContext(e, model)
  }

  return [handleOpen]
}

export default useCreateContext
