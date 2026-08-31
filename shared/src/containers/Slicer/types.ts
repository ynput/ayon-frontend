import { OnSliceTypeChange } from './context/SlicerContext'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'
import { RowSelectionState } from '@tanstack/react-table'
import { ExpandedState } from '@tanstack/react-table'
import { FilterValue } from '@ynput/ayon-react-components'
export type SliceType =
  | 'hierarchy'
  | 'assignees'
  | 'status'
  | 'type'
  | 'taskType'
  | 'entityList'
  | string

// panel id doubles as the slice type: a dimension may only appear in one panel
export interface SlicePanel {
  id: string
  sliceType: SliceType
}

// view settings are an untyped dict on the server; slicer keys are declared FE-side
export interface SlicerViewSettings {
  sliceType?: SliceType
  sliceTypes?: SliceType[]
}

export interface SliceFilter extends FilterValue {
  values: { id: string; label: string }[]
}

export type FilterBySliceData = {
  filter: SliceFilter | null
}

export interface SliceTypeField {
  value: SliceType
  label?: string
  icon?: string
}

export interface SlicerTableProps {
  data: SimpleTableRow[]
  isLoading: boolean
  isExpandable?: boolean // show expand/collapse icons
  sliceId: string
  globalFilter: string
}

export interface SliceData {
  getData: () => Promise<SimpleTableRow[] | undefined>
  isLoading: boolean
  isExpandable: boolean
  noValue?: boolean
  hasValue?: boolean
  isAttribute?: boolean
}

export interface Slice {
  data: SimpleTableRow[]
  isExpandable: boolean
}

export type SliceMap = Map<string, SimpleTableRow>

export interface TableData {
  sliceOptions: SliceTypeField[]
  table: Slice
  sliceMap: SliceMap
  isLoading: boolean
  sliceType: SliceType
  handleSliceTypeChange: OnSliceTypeChange
}

export interface PinnedSlice {
  sliceType: SliceType
  rowSelection: RowSelectionState
  expanded: ExpandedState
}
