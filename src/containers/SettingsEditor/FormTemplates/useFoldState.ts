import { useCallback, useEffect, useRef } from 'react'
import { $Any } from '@types'
import { updateOpenItems, useOpenItem } from './openItemsStore'
import { useFormContextSelector } from '../formContextStore'

type FoldStateArgs = {
  formContext: $Any
  /** Key of the item in the stored open items (see getListItemsPrefix) */
  itemKey: string
  /** The item's field id, to open it when a link points inside it */
  itemId: string
  /** False when the item doesn't fold: it is never opened by a link, nor reads the store */
  foldable: boolean
}

/**
 * Open state of a folding item (a list item, or a group among groups of the same shape).
 * Open items are stored for the browser session (openItemsStore). A breadcrumb link
 * pointing inside an item opens it once, like classic panels, and folding it again
 * afterwards sticks. Outline jumps don't open folds.
 */
export const useFoldState = ({ formContext, itemKey, itemId, foldable }: FoldStateArgs) => {
  const isOpen = useOpenItem(itemKey, foldable)
  const { forcedOpen, pointedInside } = useFormContextSelector(formContext, (context) => {
    // currentId is 0, not a string, while nothing is selected (SettingsEditor)
    const currentId = context.currentId
    return {
      // while searching every item stays open, so no match is hidden inside a folded one
      forcedOpen: !!context.searchText,
      pointedInside:
        !!itemId && typeof currentId === 'string' && currentId.startsWith(`${itemId}_`),
    }
  })

  const toggle = useCallback(
    () =>
      updateOpenItems((prev) =>
        prev.includes(itemKey) ? prev.filter((key) => key !== itemKey) : [...prev, itemKey],
      ),
    [itemKey],
  )
  // a click can't fold an item the search holds open: it would only flip the hidden state
  const onToggle = useCallback(() => {
    if (!forcedOpen) toggle()
  }, [forcedOpen, toggle])

  const wasPointedInside = useRef(false)
  useEffect(() => {
    const justPointed = pointedInside && !wasPointedInside.current
    wasPointedInside.current = pointedInside
    if (foldable && justPointed && !isOpen) toggle()
  }, [foldable, pointedInside, isOpen, toggle])

  const expanded = isOpen || forcedOpen

  return { expanded, onToggle, forcedOpen }
}
