import { OnSliceTypeChange } from '@context/SlicerContext'
import { SliceType } from '@shared/containers/Slicer'
import { SimpleTableRow } from '@shared/SimpleTable'

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
}

export interface Slice {
  data: SimpleTableRow[]
  isExpandable: boolean
}

export interface TableData {
  sliceOptions: SliceOption[]
  table: Slice
  isLoading: boolean
  sliceType: SliceType
  handleSliceTypeChange: OnSliceTypeChange
}
