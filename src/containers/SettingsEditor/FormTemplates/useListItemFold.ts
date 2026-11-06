import { useCallback, useMemo } from 'react'
import { $Any } from '@types'
import {
  getListItemSummaryParts,
  getListItemsPrefix,
  remapOpenListItems,
  removedIndex,
} from '../SettingsGroup/SettingsGroupHelpers'
import type { SettingsListItemState } from '../SettingsGroup/SettingsListItemContextInstance'
import type { ListItemLayout } from './listItemLayout'
import { useFoldState } from './useFoldState'
import { updateOpenItems } from './openItemsStore'

// Fields an item without a name is titled by, in order
const TITLE_FIELDS = ['label', 'title']

type ListItemFoldArgs = {
  formContext: $Any
  /** How the item is drawn (useListItemLayouts); none in the classic layout */
  layout?: ListItemLayout
  /** props of the item's SchemaField: its schema, data and id */
  childProps: $Any
  index: number
}

/**
 * Folding of one list item in the flat layout. A complex object folds to one line; a record
 * of single values becomes a boxed row or a card (`contentSchema`, the item's schema drawn
 * that way, see getListItemLayout). Open items are stored for the browser session,
 * keyed by list and index (useFoldState).
 */
export const useListItemFold = ({ formContext, layout, childProps, index }: ListItemFoldArgs) => {
  const flatLayout = !!formContext?.flatLayout
  // the fields decide how the item looks; the schema's layout hint never does
  const itemSchema = layout?.itemSchema ?? null
  const presentation = layout?.presentation ?? 'plain'
  const isFoldable = presentation === 'fold'
  const wrapped = layout?.wrapped
  const contentSchema = useMemo(() => {
    if (presentation === 'row' || presentation === 'card') {
      // listLayout keeps the compact layout past the three fields flat allows a compact object
      const asList = { layout: 'compact', listLayout: presentation }
      // an item that wraps one group (a path mapping) is drawn as that group's row or card: the
      // wrapper steps aside (listUnwrap names the group) and the group gets the layout
      if (!wrapped) return { ...itemSchema, ...asList }
      return {
        ...itemSchema,
        listUnwrap: wrapped.name,
        properties: { ...itemSchema?.properties, [wrapped.name]: { ...wrapped.schema, ...asList } },
      }
    }
    // a compact hint on an item that can't be a row would draw its fields in a line
    if (itemSchema?.layout === 'compact') return { ...itemSchema, layout: undefined }
    return null
  }, [presentation, itemSchema, wrapped])

  const itemId: string = childProps.idSchema?.$id || ''
  const prefix = getListItemsPrefix(formContext, itemId.split('_').slice(0, -1).join('_'))
  const { expanded, onToggle } = useFoldState({
    formContext,
    itemKey: `${prefix}${index}`,
    itemId,
    foldable: isFoldable,
  })

  // an item is titled by its name, else its label or title (a menu item's), and shows its
  // first values beside it; an item with none of these is titled by its first value and
  // shows the next ones
  const properties = itemSchema?.properties || {}
  const named = 'name' in properties
  const leadField = named ? 'name' : TITLE_FIELDS.find((key) => key in properties)
  const summaryParts = useMemo(
    () =>
      isFoldable ? getListItemSummaryParts(itemSchema, childProps.formData, 3, leadField) : [],
    [isFoldable, itemSchema, childProps.formData, leadField],
  )
  const titleValue = !named && leadField ? String(childProps.formData?.[leadField] ?? '') : ''
  const fallbackTitle =
    titleValue || (leadField ? 'Untitled item' : summaryParts[0]) || `Item ${index + 1}`
  const summary = (leadField ? summaryParts.slice(0, 2) : summaryParts.slice(1)).join(' · ')

  const itemState: SettingsListItemState = useMemo(
    () => ({ expanded, onToggle, named, leadField, summary, fallbackTitle, empty: false }),
    [expanded, onToggle, named, leadField, summary, fallbackTitle],
  )

  // the open state of the items after a removed one moves up with them
  const onItemRemoved = useCallback(() => {
    if (flatLayout) updateOpenItems((prev) => remapOpenListItems(prev, prefix, removedIndex(index)))
  }, [flatLayout, prefix, index])

  return { isFoldable, itemState, onItemRemoved, contentSchema }
}
