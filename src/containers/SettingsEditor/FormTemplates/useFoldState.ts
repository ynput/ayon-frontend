import { useCallback, useEffect, useRef } from 'react'
import { useSessionStorage } from '@shared/hooks'
import { $Any } from '@types'
import { OPEN_LIST_ITEMS_KEY } from '../SettingsGroup/SettingsGroupHelpers'

type FoldStateArgs = {
  formContext: $Any
  /** Key of the item in the stored open items (see getListItemsPrefix) */
  itemKey: string
  /** The item's field id, to open it when a link points inside it */
  itemId: string
  /** False when the item doesn't fold: it is never opened by a link */
  foldable: boolean
}

/**
 * Open state of a folding item (a list item, or a group among groups of the same shape).
 * Open items are stored for the browser session. A link or the outline pointing inside
 * an item opens it once, like classic panels; folding it again afterwards sticks.
 */
export const useFoldState = ({ formContext, itemKey, itemId, foldable }: FoldStateArgs) => {
  const [openItems, setOpenItems] = useSessionStorage<string[]>(OPEN_LIST_ITEMS_KEY, [])
  const isOpen = openItems.includes(itemKey)

  const onToggle = useCallback(
    () =>
      setOpenItems((prev) =>
        prev.includes(itemKey) ? prev.filter((key) => key !== itemKey) : [...prev, itemKey],
      ),
    [itemKey, setOpenItems],
  )

  // currentId is 0, not a string, while nothing is selected (SettingsEditor)
  const currentId = formContext?.currentId
  const pointedInside =
    !!itemId && typeof currentId === 'string' && currentId.startsWith(`${itemId}_`)
  const wasPointedInside = useRef(false)
  useEffect(() => {
    const justPointed = pointedInside && !wasPointedInside.current
    wasPointedInside.current = pointedInside
    if (foldable && justPointed && !isOpen) onToggle()
  }, [foldable, pointedInside, isOpen, onToggle])

  // while searching every item stays open, so no match is hidden inside a folded one
  const expanded = isOpen || !!formContext?.searchText

  return { expanded, onToggle, setOpenItems }
}
