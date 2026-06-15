// Frontend-owned view settings types.
//
// The backend stores view `settings` as an untyped dict and no longer ships
// per-page settings schemas, so these shapes live here instead of in the
// generated REST types. Adding a view setting is now a frontend-only change.

import type { QueryFilter } from './generated/folders'

export type DisplayStyle = 'cards' | 'table' | 'playlist'

// Backend stores view columns as an untyped dict, so this shape lives here too.
export type ColumnItemModel = {
  name: string
  visible?: boolean
  pinned?: boolean
  width?: number
}

export type OverviewSettings = {
  showHierarchy?: boolean
  rowHeight?: number
  groupBy?: string
  groupSortByDesc?: boolean
  showEmptyGroups?: boolean
  sortBy?: string
  sortDesc?: boolean
  filter?: QueryFilter
  folderFilter?: QueryFilter
  sliceType?: string
  columns?: ColumnItemModel[]
}

export type TaskProgressSettings = {
  filter?: QueryFilter
  sliceType?: string
  columns?: ColumnItemModel[]
}

export type ListsSettings = {
  rowHeight?: number
  sortBy?: string
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}

export type ReviewsSettings = ListsSettings & {
  gridHeight?: number
  displayStyle?: DisplayStyle
}

export type VersionsSettings = {
  showProducts?: boolean
  rowHeight?: number
  showGrid?: boolean
  gridHeight?: number
  featuredVersionOrder?: string[]
  slicerType?: string
  groupBy?: string
  groupSortByDesc?: boolean
  showEmptyGroups?: boolean
  sortBy?: string
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}

export type ViewSettings =
  | OverviewSettings
  | TaskProgressSettings
  | ListsSettings
  | ReviewsSettings
  | VersionsSettings
  | Record<string, unknown>
