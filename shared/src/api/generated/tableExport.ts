import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    exportTable: build.mutation<ExportTableApiResponse, ExportTableApiArg>({
      query: (queryArg) => ({
        url: `/api/export-table`,
        method: 'POST',
        body: queryArg.exportTableRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ExportTableApiResponse = /** status 200 Successful Response */ any
export type ExportTableApiArg = {
  exportTableRequest: ExportTableRequest
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ExportTasksQuery = {
  /** Only tasks with these ids */
  ids?: string[]
  /** Only tasks in these folders */
  folderIds?: string[]
  /** Include tasks in subfolders of folder_ids */
  includeFolderChildren?: boolean
  /** Task QueryFilter (JSON) */
  filter?: string
  /** QueryFilter (JSON) the task's folder has to match */
  folderFilter?: string
  /** Fuzzy text search */
  search?: string
}
export type ExportProductsQuery = {
  /** Only products with these ids */
  ids?: string[]
  /** Only products in these folders */
  folderIds?: string[]
  /** Include products in subfolders of folder_ids */
  includeFolderChildren?: boolean
  /** Product QueryFilter (JSON) */
  filter?: string
  /** Folder QueryFilter (JSON) */
  folderFilter?: string
  /** Version QueryFilter (JSON) */
  versionFilter?: string
  /** Task QueryFilter (JSON) */
  taskFilter?: string
  /** Row order, as the GraphQL sortBy argument */
  sortBy?: string[]
  /** Which version fills the version and author columns */
  featuredVersionOrder?: string[]
}
export type ExportVersionsQuery = {
  /** Only versions with these ids */
  ids?: string[]
  /** Only versions of these products. Without ids, versions exported with products are those of the products */
  productIds?: string[]
  /** Only versions in these folders */
  folderIds?: string[]
  /** Include versions in subfolders of folder_ids */
  includeFolderChildren?: boolean
  /** Version QueryFilter (JSON) */
  filter?: string
  /** Folder QueryFilter (JSON) */
  folderFilter?: string
  /** Product QueryFilter (JSON) */
  productFilter?: string
  /** Task QueryFilter (JSON) */
  taskFilter?: string
  /** One version per product: 'hero', 'latestDone', 'latest' */
  featuredOnly?: string[]
  /** Latest version per folder */
  latestPerFolder?: boolean
  /** Only versions with (or without) reviewables */
  hasReviewables?: boolean
  /** Row order, as the GraphQL sortBy argument */
  sortBy?: string[]
}
export type ExportListQuery = {
  /** Entity list id */
  id: string
  /** Only these list items */
  itemIds?: string[]
  /** List item QueryFilter (JSON) */
  filter?: string
  /** Fuzzy text search */
  search?: string
  /** Row order, as the GraphQL sortBy argument */
  sortBy?: string[]
}
export type ExportTableRequest = {
  projectName: string
  /** Column keys in order: entity fields (`status`, `attrib.priority`...), `entity_type`, `path`, `folder`, `task`, `product`, `version`, `author`, `created_at` and `updated_at`. Prefixed with `folder.`, `task.` or `product.`, a key is a field of the row's parent, e.g. `product.attrib.productGroup` */
  columns?: string[]
  /** Column names to use instead of the field labels */
  columnLabels?: {
    [key: string]: string
  }
  /** Folders to export as rows */
  folderIds?: string[]
  /** Tasks to export as rows */
  tasks?: ExportTasksQuery
  /** Products to export as rows */
  products?: ExportProductsQuery
  /** Versions to export as rows */
  versions?: ExportVersionsQuery
  /** List items to export as rows */
  entityList?: ExportListQuery
  /** File format */
  format?: 'csv' | 'xlsx'
  /** CSV delimiter */
  delimiter?: ',' | ';' | '\t'
  /** Column names: labels or field names (keys) */
  header?: 'label' | 'key'
  /** Raw values, or labels: enum labels, full names of users, readable dates and names replaced by labels */
  values?: 'value' | 'label'
}
