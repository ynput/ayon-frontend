import { OnSliceTypeChange } from './context/SlicerContext'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { FilterValue } from '@ynput/ayon-react-components'
export type SliceType = 'hierarchy' | 'assignees' | 'status' | 'type' | 'taskType' | string

export type SliceDataItem = {
  id: string
  name?: string | null
  label?: string | null
  subType?: string | null
  path?: string | null // Full folder path (e.g., "editorial/storyboards/")
  parents?: string[] | null // Array of parent folder names for path reconstruction
}

export type SelectionData = Record<string, SliceDataItem>

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
