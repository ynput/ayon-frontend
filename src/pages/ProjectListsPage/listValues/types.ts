// Contract between the Lists page and the powerpack `ListValues` module (remote `slicer`).
// The powerpack keeps its own copy of these types: change both sides together, see AGENTS.md.
import type { ComponentType } from 'react'
import type { AttribCellMark } from '@shared/containers/ProjectTreeTable'

export const LIST_VALUES_API_VERSION = 1

export const COMPARE_WITH_ENTITIES = 'entities'

// One list item's values, as the Lists page reads them from the query
export type ListItemValueSources = {
  listAttrib: Record<string, unknown> // values set on the list item
  entityAttrib: Record<string, unknown> // the entity's values, inherited ones included
  entityOwnAttrib: string[] // attributes set on the entity itself
}

// A list item as the Lists page hands it to the module (restricted ones are left out)
export type ListValuesItem = ListItemValueSources & {
  id: string // the list item id, also the table row id
  entityId: string
  entityType: string
}

export type ListRef = { id: string; label: string; entityType: string }

export type ListValuesContext = {
  listAttributes: string[] // names of the list's own attributes
  formatValue: (attrib: string, value: unknown) => string
}

export type ResolvedListItemValues = {
  attrib: Record<string, unknown> // values the cells show
  ownAttrib: string[] // attributes shown as set (the rest are shown greyed as inherited)
  marks: Record<string, AttribCellMark>
}

export type ListValueEditTarget = 'entity' | 'listItem'

// The value shown in a compare column next to an attribute column
export type ListValueComparison = {
  value: unknown
  isInherited: boolean // shown greyed
  differs: boolean // differs from the value in the attribute column
  highlight?: string // tint colour of the pair
  missing?: boolean // the entity is not in the compared list
  duplicated?: boolean // listed more than once in the compared list
  onlyInCompared?: boolean // not in the shown list, only in the compared one
}

export type CompareHighlight = 'different' | 'same'

// Stored with the view by the Lists page, defined by the module
export type CompareSettings = {
  highlight?: CompareHighlight // which pairs get the tint
  color?: string
  showBoth?: boolean // compared with another list: also show the entities only in it
}

// The Lists page's query of a list's items, as a hook so it keeps the page's cache
export type UseListItems<T> = (args: {
  listId?: string
  filter?: string // the backend's QueryFilter as JSON
  search?: string
  skip?: boolean
}) => { items: T[] | undefined; refetch: () => void }

export type CompareViewHost<T> = {
  shownList?: ListRef
  items: T[] // the shown list's loaded items
  allItemsLoaded: boolean
  toItem: (item: T) => ListValuesItem | undefined // undefined for restricted items
  attributes: string[] // entity attributes the table shows
  query: { filter?: string; search?: string } // the table's, also applied to the compared list
  context: ListValuesContext
  getList: (id: string) => ListRef | undefined // the lists the page knows (labels change)
  settings: CompareSettings
  useListItems: UseListItems<T>
}

export type CompareView<T> = {
  compareWith: string | null // COMPARE_WITH_ENTITIES, a list id, or null (off)
  comparedList: ListRef | null
  setCompareWith: (compareWith: string | null) => void
  compareWithList: (list: ListRef) => void
  values?: Map<string, Record<string, ListValueComparison>> // row id -> attribute -> compared value
  marks: Map<string, Record<string, AttribCellMark>> // row id -> attribute -> marks on the list's cells
  compareOnlyItems: T[] // only in the compared list: read-only rows after the list's own
  refetchCompareOnly: () => void
}

export type ListValueMenuItem = {
  label: string
  icon: string
  command?: () => void
  powerFeature?: string // shows the powerpack dialog instead
}

// What the cell and column actions need from the Lists page
export type ListValueActionsHost = {
  listId: string
  context: ListValuesContext
  getItem: (rowId: string) => ListValuesItem | undefined // a loaded item
  loadAllItems: () => Promise<ListValuesItem[]> // every item, also the ones not loaded yet
  patchListItems: (items: { id: string; attrib: Record<string, unknown> }[]) => Promise<void>
  updateEntities: (
    items: {
      rowId: string
      entityId: string
      entityType: string
      attrib: Record<string, unknown>
      ownAttrib: string[]
    }[],
  ) => Promise<void>
  notify: {
    loading: (message: string) => string | number
    done: (id: string | number, message: string, type: 'success' | 'error') => void
    error: (message: string) => void
  }
  confirm: (options: { header: string; message: string; acceptLabel: string }) => Promise<boolean>
}

// The Lists page's list picker (lists table in picker mode), used by the module's dialog
export type ListPickerProps = {
  isDisabled: (list: ListRef) => string | undefined // why a list can't be picked
  initialSelection?: string // a list id, selected, scrolled to and focused
  onSelect: (list: ListRef | undefined) => void
  onSubmit: (list: ListRef) => void // double-click or Enter
}

export type ListValuesControlsProps = {
  view: CompareView<unknown>
  shownList?: ListRef
  ListPicker: ComponentType<ListPickerProps>
}

export type CompareSettingsProps = {
  settings: CompareSettings
  onChange: (settings: CompareSettings) => void
}

export type ListValuesModule = {
  apiVersion: number
  Controls: ComponentType<ListValuesControlsProps> // toolbar: Compare with
  CompareSettings: ComponentType<CompareSettingsProps> // Customize > Compare
  getCompareSettingsPreview: (settings: CompareSettings) => string | undefined
  resolveValues: (
    sources: ListItemValueSources,
    context: ListValuesContext,
  ) => ResolvedListItemValues
  // where an edit of an attribute cell is written; 'entity' also means the cell shows the entity's value
  getEditTarget: (attrib: string, context: ListValuesContext) => ListValueEditTarget
  // a hook: the Lists page keeps one module per mount, see AGENTS.md
  useCompareView: <T>(host: CompareViewHost<T>) => CompareView<T>
  getCellMenuItems: (
    cells: { rowId: string; attrib: string }[],
    host: ListValueActionsHost,
  ) => ListValueMenuItem[]
  getColumnMenuItems: (attrib: string, host: ListValueActionsHost) => ListValueMenuItem[]
  // the lists sidebar menu of another list
  getListMenuItems: (
    list: ListRef,
    shownList: ListRef | undefined,
    view: CompareView<unknown>,
  ) => ListValueMenuItem[]
}
