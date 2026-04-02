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
          skip_errors: queryArg.skipErrors,
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
export type UploadFileApiResponse = /** status 200 Successful Response */ ImportUpload
export type UploadFileApiArg = {
  ttl?: number
  csv: string
}
export type ImportDataApiResponse = /** status 200 Successful Response */ ImportStatus
export type ImportDataApiArg = {
  importType: 'user' | 'folder' | 'task' | 'hierarchy' | 'entity_list_item'
  fileId: string
  skipErrors?: boolean
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
  defaultValue: string
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
