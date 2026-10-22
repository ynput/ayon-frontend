import { useMemo } from 'react'
import { $Any } from '@types'
import { getListItemSummaryParts, getListItemsPrefix } from '../SettingsGroup/SettingsGroupHelpers'
import type { SettingsListItemState } from '../SettingsGroup/SettingsListItemContextInstance'
import { useFoldState } from './useFoldState'

type GroupFoldArgs = {
  formContext: $Any
  /** Field id of the object holding the group */
  parentId: string
  /** The group's key in that object */
  name: string
  /** The group's resolved schema and its values */
  schema: $Any
  formData: $Any
}

/**
 * Folding of a group among groups of the same shape (see getFoldingGroupNames). It is
 * stored open by its key, as the groups are fixed: they never move like list items.
 */
export const useGroupFold = ({ formContext, parentId, name, schema, formData }: GroupFoldArgs) => {
  const { expanded, onToggle } = useFoldState({
    formContext,
    itemKey: `${getListItemsPrefix(formContext, parentId)}${name}`,
    itemId: `${parentId}_${name}`,
    foldable: true,
  })

  const summary = useMemo(
    () => getListItemSummaryParts(schema, formData).slice(0, 2).join(' · '),
    [schema, formData],
  )

  // the group keeps its own title, so it counts as named
  return useMemo<SettingsListItemState>(
    () => ({ expanded, onToggle, named: true, summary, fallbackTitle: name }),
    [expanded, onToggle, summary, name],
  )
}
