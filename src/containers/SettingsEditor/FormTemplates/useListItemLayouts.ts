import { RefObject, useMemo } from 'react'
import { ArrayFieldTemplateProps } from '@rjsf/utils'
import { $Any } from '@types'
import {
  ListItemLayout,
  asNarrowListItem,
  getListItemLayout,
  getRowNeededWidth,
} from './listItemLayout'
import { useFitsWidth } from './useFitsWidth'

export type ListItemLayouts = {
  /** The layout of each item, by index */
  items: ListItemLayout[]
  /** Whether the list's items are folding boxes: a new item then opens */
  itemsFold: boolean
}

/**
 * How the items of a list are drawn in the flat layout (see getListItemLayout), worked out once
 * for the whole list, and again only when its schema, its values or the level being edited
 * change. Rows need the width their cells count: in a list narrower than that (`listRef`, a
 * narrow settings pane) they are drawn as cards, their values stacked. None in the classic layout.
 */
export const useListItemLayouts = (
  { schema, formData, registry, formContext }: ArrayFieldTemplateProps,
  listRef: RefObject<HTMLElement>,
): ListItemLayouts | null => {
  const flatLayout = !!formContext?.flatLayout
  // the registry and the form context are new objects on every render; these are not
  const { schemaUtils } = registry
  const level = formContext?.level
  const includeStudioScope = formContext?.includeStudioScope

  const layouts = useMemo(() => {
    const itemsSchema = schema.items
    if (!flatLayout || !itemsSchema || typeof itemsSchema !== 'object') return null
    if (Array.isArray(itemsSchema)) return null
    const context = { schemaUtils, formContext: { level, includeStudioScope } }
    const values: $Any[] = Array.isArray(formData) ? formData : []
    return {
      items: values.map((value) => getListItemLayout(itemsSchema, value, context)),
      itemsFold: getListItemLayout(itemsSchema, undefined, context).presentation === 'fold',
    }
  }, [flatLayout, schema.items, formData, schemaUtils, level, includeStudioScope])

  // the widest row decides: the rows of a list stay one table, or all become cards
  const needed = Math.max(0, ...(layouts?.items.map(getRowNeededWidth) ?? []))
  const rowsFit = useFitsWidth(listRef, needed)

  return useMemo(
    () =>
      layouts && !rowsFit ? { ...layouts, items: layouts.items.map(asNarrowListItem) } : layouts,
    [layouts, rowsFit],
  )
}
