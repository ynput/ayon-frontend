import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    exportFields: build.query<ExportFieldsApiResponse, ExportFieldsApiArg>({
      query: (queryArg) => ({
        url: `/api/csv/export/${queryArg.entityType}/fields`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    postApiCsvExportByEntityType: build.mutation<
      PostApiCsvExportByEntityTypeApiResponse,
      PostApiCsvExportByEntityTypeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/csv/export/${queryArg.entityType}`,
        method: 'POST',
        body: queryArg.bodyExportApiCsvExportEntityTypePost,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    exportTable: build.mutation<ExportTableApiResponse, ExportTableApiArg>({
      query: (queryArg) => ({
        url: `/api/csv/table/export`,
        method: 'POST',
        body: queryArg.exportTableRequest,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    uploadFile: build.mutation<UploadFileApiResponse, UploadFileApiArg>({
      query: (queryArg) => ({
        url: `/api/csv/import/upload`,
        method: 'PUT',
        body: queryArg.csv,
        params: {
          ttl: queryArg.ttl,
        },
      }),
    }),
    importData: build.mutation<ImportDataApiResponse, ImportDataApiArg>({
      query: (queryArg) => ({
        url: `/api/csv/import/${queryArg.importType}`,
        method: 'POST',
        body: queryArg.columnMapping,
        params: {
          file_id: queryArg.fileId,
          existing_strategy: queryArg.existingStrategy,
          project_name: queryArg.projectName,
          folder_id: queryArg.folderId,
          preview: queryArg.preview,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ExportFieldsApiResponse = /** status 200 Successful Response */ ImportableColumn[]
export type ExportFieldsApiArg = {
  entityType: 'user' | 'folder' | 'task' | 'hierarchy' | 'entity_list_item'
  projectName?: string
}
export type PostApiCsvExportByEntityTypeApiResponse = /** status 200 Successful Response */ any
export type PostApiCsvExportByEntityTypeApiArg = {
  entityType: 'user' | 'folder' | 'task' | 'hierarchy' | 'entity_list_item'
  projectName?: string
  bodyExportApiCsvExportEntityTypePost: BodyExportApiCsvExportEntityTypePost
}
export type ExportTableApiResponse = /** status 200 Successful Response */ any
export type ExportTableApiArg = {
  projectName: string
  exportTableRequest: ExportTableRequest
}
export type UploadFileApiResponse = /** status 200 Successful Response */ ImportUpload
export type UploadFileApiArg = {
  ttl?: number
  csv: string
}
export type ImportDataApiResponse = /** status 200 Successful Response */ ImportStatus
export type ImportDataApiArg = {
  importType: 'user' | 'folder' | 'task' | 'hierarchy' | 'entity_list_item'
  fileId: string
  existingStrategy?: 'skip' | 'update' | 'fail'
  projectName?: string
  folderId?: string
  preview?: boolean
  columnMapping: ColumnMapping[]
}
export type IconModel = {
  type?: 'material-symbols' | 'url'
  /** The name of the icon (for type material-symbols) */
  name?: string
  /** The color of the icon (for type material-symbols) */
  color?: string
  /** The URL of the icon (for type url) */
  url?: string
}
export type EnumItem = {
  value: string | number | number | boolean
  label: string
  description?: string
  fulltext?: string[]
  group?: string
  /** Icon name (material symbol) or IconModel object */
  icon?: string | IconModel
  color?: string
  /** Enum item is visible, but not selectable */
  disabled?: boolean
  /** Message to show when the option is disabled */
  disabledMessage?: string
}
export type ImportableColumn = {
  /** The key of the column, such as `name`, `attrib.priority`, etc. */
  key: string
  /** The label of the column, such as `Name`, `Priority`, etc. This is used for display purposes only. */
  label: string
  /** If value in field is required */
  required: boolean
  /** The type of the value in this column. This is used to determine how to parse the value. For example: `name` column has type `string`, `assignees` `list_of_strings` etc. */
  valueType:
    | 'string'
    | 'integer'
    | 'float'
    | 'boolean'
    | 'datetime'
    | 'list_of_strings'
    | 'list_of_integers'
    | 'list_of_any'
    | 'list_of_submodels'
    | 'dict'
  /** If value in field is required */
  defaultValue?: string
  /** A list of possible enum items for this column (if set) */
  enumItems?: EnumItem[]
  /** The enum resolver name (e.g., 'statuses', 'folderTypes') */
  enumName?: string
  /** A list of possible error handling modes for this column. Every column can have different available modes: For example: `name` column cannot use `default`, because default name cannot be generated. */
  errorHandlingModes: ('skip' | 'abort' | 'default')[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type BodyExportApiCsvExportEntityTypePost = {
  field_names?: string[]
  entity_ids?: any[]
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
  /** Column keys in order: entity fields (`status`, `attrib.priority`...), `entity_type`, `path`, `folder`, `task`, `product`, `version`, `author`, `created_at` and `updated_at` */
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
export type ImportUpload = {
  id: string
}
export type ImportStatus = {
  created?: number
  updated?: number
  skipped?: number
  failed?: number
  failedItems?: object
  preview?: boolean
}
export type ColumnValueMapping = {
  /** The source value from csv */
  source?: string
  /** The target value from csv */
  target?: string
  /** Map, skip or create missing */
  action: 'map' | 'skip' | 'create'
}
export type ColumnMapping = {
  /** The key of the column, such as `name`, `attrib.priority`, etc. */
  sourceKey: string
  /** The key of the column, such as `name`, `attrib.priority`, etc. */
  targetKey: string
  /** Map or skip whole column */
  action: 'map' | 'skip'
  /** Handle errors in this column. 'abort' to stop import */
  errorHandlingMode: 'skip' | 'abort' | 'default'
  /** List of values mapping mostly for enum fields */
  valuesMapping: ColumnValueMapping[]
}
