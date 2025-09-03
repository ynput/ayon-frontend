import { OnSliceTypeChange } from '@context/SlicerContext'
import { SliceType } from '@shared/containers/Slicer'
import { SimpleTableRow } from '@shared/containers/SimpleTable'

export interface SliceOption {
  value: SliceType
  label: string
  icon: string
}

export interface SlicerTableProps {
  data: SimpleTableRow[]
  isLoading: boolean
  isExpandable?: boolean // show expand/collapse icons
  sliceId: string
  globalFilter: string
}

export interface SliceData {
  getData: () => Promise<SimpleTableRow[]>
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
  sliceOptions: SliceOption[]
  table: Slice
  sliceMap: SliceMap
  isLoading: boolean
  sliceType: SliceType
  handleSliceTypeChange: OnSliceTypeChange
}
