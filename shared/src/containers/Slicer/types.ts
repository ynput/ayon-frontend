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
