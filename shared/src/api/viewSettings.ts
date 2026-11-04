import type { QueryFilter } from './generated'

/**
 * Settings stored in a view, per page (`viewType`).
 *
 * The backend treats `settings` as a free-form object (`GenericViewModel`), so the shape of each
 * page's settings is owned here and is not part of the generated API types. Keep these in step
 * with what the pages read and write.
 */

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
  sortBy?: string | string[]
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
  sortBy?: string | string[]
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}

export type ReviewsSettings = {
  rowHeight?: number
  sortBy?: string | string[]
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
  gridHeight?: number
  displayStyle?: 'cards' | 'table' | 'playlist'
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
  latestPerFolder?: boolean
  sortBy?: string | string[]
  sortDesc?: boolean
  filter?: QueryFilter
  columns?: ColumnItemModel[]
}
