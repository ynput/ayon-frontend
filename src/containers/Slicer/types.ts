import { OnSliceTypeChange, SliceDataItem, SliceType } from '@context/SlicerContext'

export interface SliceOption {
  value: SliceType
  label: string
  icon: string
}

export type TableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  icon?: string | null
  iconColor?: string
  img?: string | null
  startContent?: JSX.Element
  subRows: TableRow[]
  data: SliceDataItem
}

export interface SlicerTableProps {
  data: TableRow[]
  isLoading: boolean
  isExpandable?: boolean // show expand/collapse icons
  sliceId: string
  globalFilter: string
}

export interface SlicerTableProps {
  data: TableRow[]
  isLoading: boolean
  isExpandable?: boolean // show expand/collapse icons
  sliceId: string
  globalFilter: string
}

export interface SliceData {
  getData: () => Promise<TableRow[]>
  isLoading: boolean
  isExpandable: boolean
  noValue?: boolean
  hasValue?: boolean
}

export interface Slice {
  data: TableRow[]
  isExpandable: boolean
}

export interface TableData {
  sliceOptions: SliceOption[]
  table: Slice
  isLoading: boolean
  sliceType: SliceType
  handleSliceTypeChange: OnSliceTypeChange
}
