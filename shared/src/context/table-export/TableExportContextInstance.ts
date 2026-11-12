import { createContext, useContext } from 'react'

// The table export is a Power Pack feature: its dialog is the Power Pack App module
// `tableExport/TableExportApp`. The host only says what the open table would export.

export type TableExportScope = 'table' | 'selection'

// the URL search param that opens the export dialog, its value is the scope
export const TABLE_EXPORT_SEARCH_PARAM = 'tableExport'

// The dialog passes all its settings, the format and content too
export type TableExportOptions = {
  includeImportColumns: boolean // entity type and path, needed to import the file back
  selectionColumns: 'selected' | 'visible' // the columns of a selection export
  format?: 'xlsx' | 'csv'
  content?: 'readable' | 'raw' // raw: field names and stored values
}

export type TableExportTasksQuery = {
  ids?: string[]
  folderIds?: string[]
  includeFolderChildren?: boolean
  filter?: string
  folderFilter?: string
  search?: string
  sortBy?: string[]
}

export type TableExportProductsQuery = {
  ids?: string[]
  folderIds?: string[]
  includeFolderChildren?: boolean
  filter?: string
  folderFilter?: string
  versionFilter?: string
  taskFilter?: string
  representationFilter?: string
  sortBy?: string[]
  featuredVersionOrder?: string[]
}

export type TableExportVersionsQuery = {
  ids?: string[]
  productIds?: string[]
  folderIds?: string[]
  includeFolderChildren?: boolean
  filter?: string
  folderFilter?: string
  productFilter?: string
  taskFilter?: string
  representationFilter?: string
  featuredOnly?: string[]
  latestPerFolder?: boolean
  hasReviewables?: boolean
  sortBy?: string[]
}

export type TableExportListQuery = {
  id: string
  itemIds?: string[]
  filter?: string
  search?: string
  sortBy?: string[]
}

// users of the Users settings table, exported in this order
export type TableExportUsersQuery = {
  names: string[]
}

export type TableExportRows = {
  folderIds?: string[]
  tasks?: TableExportTasksQuery
  products?: TableExportProductsQuery
  versions?: TableExportVersionsQuery
  entityList?: TableExportListQuery
  users?: TableExportUsersQuery // not combined with project rows
}

// the rows and columns of an export request, the addon adds the project and file options
export type TableExportContent = TableExportRows & {
  columns: string[]
  columnLabels: Record<string, string>
}

// What the open table exports, registered by its page
export type TableExportSource = {
  projectName: string // empty for tables outside a project (users)
  canImport: boolean // the rows can be imported back with Import CSV
  importColumnsLabel?: string // what includeImportColumns adds, "entity type and path" by default
  rowSelection?: boolean // the table selects whole rows, not cells: no selected columns to choose
  minPowerpackVersion?: string // the Power Pack version that exports this table, if newer than the first
  selectedRowsCount: number
  getContent: (scope: TableExportScope, options: TableExportOptions) => TableExportContent
  // labels of the columns the export leaves out (thumbnails, links, ...)
  getSkippedColumns: (scope: TableExportScope, options: TableExportOptions) => string[]
}

export type TableExportContextType = {
  source: TableExportSource | null
  // the Power Pack table export is licensed and installed
  isAvailable: boolean
  // opens the export dialog, or the Power Pack dialog without a license
  openExport: (scope: TableExportScope) => void
  registerSource: (source: TableExportSource) => () => void
}

export const TableExportContext = createContext<TableExportContextType | null>(null)

// null outside the TableExportProvider (app root)
export const useTableExportContext = () => useContext(TableExportContext)
