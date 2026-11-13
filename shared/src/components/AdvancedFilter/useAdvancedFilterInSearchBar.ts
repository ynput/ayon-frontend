import { MouseEvent, createElement, useMemo, useState } from 'react'
import { Filter, Icon, Option, getFilterFromId } from '@ynput/ayon-react-components'
import { usePowerpack } from '@shared/context'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  AdvancedFilterField,
  appendToQueryFilter,
  buildAdvancedFilterFields,
  toEditableConditions,
} from '@shared/containers/ProjectTreeTable/utils/advancedFilter'
import { clientFilterToQueryFilter } from '@shared/containers/ProjectTreeTable/utils/clientFilterToQueryFilter'
import { ADVANCED_FILTER_LABEL } from './AdvancedFilterSlotHelpers'
import { AdvancedFilterEditor, useAdvancedFilterEditor } from './useAdvancedFilterEditor'

const OPTION_ID = 'open-advanced-filter'
const NO_FIELDS: AdvancedFilterField[] = []

type Props = {
  // the advanced filter; without onChange the page has none and nothing is shown.
  // `filter` is the search bar's filter, to save in the same update.
  value?: QueryFilter
  onChange?: (value: QueryFilter | undefined, filter?: QueryFilter) => void
  // the fields: options of the search bar (or more), the entity types of a multi-scope page
  // and the option ids the advanced filter can't use
  options: Option[]
  scopes?: string[]
  exclude?: string[]
  // the search bar's chips that may move to the advanced filter
  filters: Filter[]
  // applies what is picked in the search bar and closes its dropdown
  applySearchBar: () => void
  // takes these chips out of the search bar, closes its dropdown and returns its filter
  // without them (not saved: it is saved with the advanced filter)
  removeFilters: (ids: string[]) => QueryFilter
}

export type AdvancedFilterInSearchBar = {
  // for AdvancedFilterSlot and AdvancedFilterDropdownButton
  editor: AdvancedFilterEditor
  fields: AdvancedFilterField[]
  openRequest: number
  // applies the search bar and opens the editor
  open: () => void
  // moves the chip being edited to the advanced filter and opens the editor (only opens it
  // when the advanced filter can't take that chip)
  switchFilter: (filterId: string | null) => void
  // the "Advanced filter" entry to add at the end of the search bar's options, if any
  option: Option | null
  // for the dropdown's item onClick: false when it was a click on that entry
  handleItemClick: (event: MouseEvent<HTMLLIElement>) => boolean
  // chips that can move to the advanced filter (text searches stay)
  movableCount: number
  moveToAdvancedFilter: () => void
}

// What a search bar needs for the advanced filter next to it: the editor and its fields, the
// entry at the end of the field list and the button in the dropdown's bottom bar (both open the
// editor), and moving the search bar's filters into the advanced filter.
export const useAdvancedFilterInSearchBar = ({
  value,
  onChange,
  options,
  scopes,
  exclude,
  filters,
  applySearchBar,
  removeFilters,
}: Props): AdvancedFilterInSearchBar => {
  const enabled = !!onChange
  const editor = useAdvancedFilterEditor({ skip: !enabled })
  const { setPowerpackDialog } = usePowerpack()
  const [openRequest, setOpenRequest] = useState(0)

  // The options are rebuilt on every render. The editor gets a new list only when a field
  // changed (compared without `loadValues`, which is kept from the first list).
  const builtFields = editor.Editor
    ? buildAdvancedFilterFields(options, { scopes, exclude })
    : NO_FIELDS
  const fieldsKey = JSON.stringify(builtFields)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fields = useMemo(() => builtFields, [fieldsKey])

  const openEditor = () => setOpenRequest((request) => request + 1)
  const open = () => {
    applySearchBar()
    openEditor()
  }

  // nothing while the editor loads or when it can't be used (the slot says why)
  const showOption = enabled && (!!editor.Editor || (!editor.powerLicense && !editor.isLoading))
  const option: Option | null = showOption
    ? {
        id: OPTION_ID,
        label: ADVANCED_FILTER_LABEL,
        icon: 'filter_alt',
        // without a license it opens the Power Pack dialog
        contentAfter: editor.Editor ? undefined : createElement(Icon, { icon: 'bolt' }),
      }
    : null

  const handleItemClick = (event: MouseEvent<HTMLLIElement>) => {
    const item = (event.target as HTMLElement).closest('li')
    // a value with the same id belongs to a field
    if (!option || item?.id !== OPTION_ID || item.getAttribute('data-parent')) return true
    if (editor.Editor) open()
    else setPowerpackDialog('advancedFilters')
    return false
  }

  const fieldKeys = new Set(fields.map((field) => field.key))
  const movable = filters.filter((f) => f.values?.length && fieldKeys.has(getFilterFromId(f.id)))

  // one update for both filters: two at once can reach the server in either order
  const move = (chips: Filter[]) => {
    if (!onChange || !chips.length) return
    const moved = clientFilterToQueryFilter(chips).conditions || []
    const filter = removeFilters(chips.map((f) => f.id))
    onChange(appendToQueryFilter(value, toEditableConditions(moved, fields)), filter)
    openEditor()
  }

  const switchFilter = (filterId: string | null) => {
    const chip = movable.find((f) => f.id === filterId)
    if (chip) move([chip])
    else open()
  }

  const moveToAdvancedFilter = () => move(movable)

  return {
    editor,
    fields,
    openRequest,
    open,
    switchFilter,
    option,
    handleItemClick,
    movableCount: movable.length,
    moveToAdvancedFilter,
  }
}
