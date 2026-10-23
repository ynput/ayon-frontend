import { useCallback, useMemo } from 'react'
import { Registry } from '@rjsf/utils'
import { $Any } from '@types'
import {
  getListItemSummaryParts,
  getListItemsPrefix,
  isComplexListItem,
  remapOpenListItems,
  removedIndex,
} from '../SettingsGroup/SettingsGroupHelpers'
import type { SettingsListItemState } from '../SettingsGroup/SettingsListItemContextInstance'
import { resolveFlatObjectLayout } from '../SettingField'
import { isRowListItem } from './listItemLayout'
import { useFoldState } from './useFoldState'

type ListItemFoldArgs = {
  registry: Registry
  /** props of the item's SchemaField: its schema, data and id */
  childProps: $Any
  index: number
  /** False when the list's values are too long for boxed rows */
  rowsFit?: boolean
}

/**
 * Folding of one list item in the flat layout. A complex object drawn as a block of
 * fields folds to one line; a short one becomes a boxed row (`rowSchema`, the item's
 * schema with the compact layout). Open items are stored for the browser session,
 * keyed by list and index (useFoldState).
 */
export const useListItemFold = ({
  registry,
  childProps,
  index,
  rowsFit = true,
}: ListItemFoldArgs) => {
  const formContext = registry?.formContext
  const flatLayout = !!formContext?.flatLayout

  const itemSchema = useMemo(
    () =>
      flatLayout && childProps.schema
        ? registry.schemaUtils.retrieveSchema(childProps.schema, childProps.formData)
        : null,
    [flatLayout, childProps.schema, childProps.formData, registry],
  )
  // a short item of single-line fields is drawn as a boxed row instead of folding
  const isRow = rowsFit && !!itemSchema && isRowListItem(itemSchema, registry)
  const rowSchema = useMemo(
    () => (isRow ? { ...itemSchema, layout: 'compact' } : null),
    [isRow, itemSchema],
  )
  const fieldCount = Object.keys(itemSchema?.properties || {}).length
  const isFoldable =
    !isRow &&
    itemSchema?.type === 'object' &&
    isComplexListItem(itemSchema) &&
    resolveFlatObjectLayout(itemSchema.layout, fieldCount) !== 'compact'

  const itemId: string = childProps.idSchema?.$id || ''
  const prefix = getListItemsPrefix(formContext, itemId.split('_').slice(0, -1).join('_'))
  const { expanded, onToggle, setOpenItems } = useFoldState({
    formContext,
    itemKey: `${prefix}${index}`,
    itemId,
    foldable: isFoldable,
  })

  // a named item shows its first values beside its name; an unnamed one is titled by
  // its first value and shows the next ones
  const named = 'name' in (itemSchema?.properties || {})
  const summaryParts = useMemo(
    () => (isFoldable ? getListItemSummaryParts(itemSchema, childProps.formData) : []),
    [isFoldable, itemSchema, childProps.formData],
  )
  const fallbackTitle = summaryParts[0] || `Item ${index + 1}`
  const summary = (named ? summaryParts.slice(0, 2) : summaryParts.slice(1)).join(' · ')

  const itemState: SettingsListItemState = useMemo(
    () => ({ expanded, onToggle, named, summary, fallbackTitle }),
    [expanded, onToggle, named, summary, fallbackTitle],
  )

  // the open state of the items after a removed one moves up with them
  const onItemRemoved = useCallback(() => {
    if (flatLayout) setOpenItems((prev) => remapOpenListItems(prev, prefix, removedIndex(index)))
  }, [flatLayout, prefix, index, setOpenItems])

  return { isFoldable, itemState, onItemRemoved, rowSchema }
}
