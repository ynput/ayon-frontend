import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    exportFields: build.query<ExportFieldsApiResponse, ExportFieldsApiArg>({
      query: (queryArg) => ({
        url: `/api/csv/export/${queryArg.entityType}/fields`,
        params: {
          project_name: queryArg.projectName,
          folder_id: queryArg.folderId,
          list_entity_type: queryArg.listEntityType,
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
          missing_strategy: queryArg.missingStrategy,
          duplicate_strategy: queryArg.duplicateStrategy,
          entity_type: queryArg.entityType,
          new_list_label: queryArg.newListLabel,
          new_list_entity_type: queryArg.newListEntityType,
          update_listed_entities: queryArg.updateListedEntities,
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
export type ExportFieldsApiResponse = /** status 200 Successful Response */
  | ImportableColumn[]
  | null
export type ExportFieldsApiArg = {
  entityType: 'user' | 'folder' | 'task' | 'hierarchy' | 'entity_list_item'
  projectName?: string | null
  folderId?: string | null
  listEntityType?:
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | null
}
export type UploadFileApiResponse = /** status 200 Successful Response */ ImportUpload
export type UploadFileApiArg = {
  ttl?: number | null
  csv: string
}
export type ImportDataApiResponse = /** status 200 Successful Response */ ImportStatus
export type ImportDataApiArg = {
  importType: 'user' | 'folder' | 'task' | 'hierarchy' | 'entity_list_item'
  fileId: string
  existingStrategy?: ExistingItemStrategy
  missingStrategy?: MissingItemStrategy
  duplicateStrategy?: DuplicateItemStrategy
  entityType?: ('folder' | 'task') | null
  newListLabel?: string | null
  newListEntityType?:
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | null
  updateListedEntities?: boolean
  projectName?: string | null
  folderId?: string | null
  preview?: boolean
  columnMapping: ColumnMapping[]
}
export type IconModel = {
  type?: 'material-symbols' | 'url'
  /** The name of the icon (for type material-symbols) */
  name?: string | null
  /** The color of the icon (for type material-symbols) */
  color?: string | null
  /** The URL of the icon (for type url) */
  url?: string | null
}
export type EnumItem = {
  value: string | number | number | boolean
  label: string
  description?: string | null
  fulltext?: string[] | null
  group?: string | null
  /** Icon name (material symbol) or IconModel object */
  icon?: string | IconModel | null
  color?: string | null
  shortName?: string | null
  /** Enum item is visible, but not selectable */
  disabled?: boolean
  /** Message to show when the option is disabled */
  disabledMessage?: string | null
  /** Enum item is not visible in the dropdown */
  hidden?: boolean
  /** Extra badge labels to display next to the item */
  badges?: string[] | null
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
  defaultValue?: string | null
  /** A list of possible enum items for this column (if set) */
  enumItems?: EnumItem[] | null
  /** The enum resolver name (e.g., 'statuses', 'folderTypes') */
  enumName?: string | null
  /** A list of possible error handling modes for this column. Every column can have different available modes: For example: `name` column cannot use `default`, because default name cannot be generated. */
  errorHandlingModes: ('skip' | 'abort' | 'default')[]
  /** Marker that new items can be created for frontend to decide if Create button should be offered. Entity_type cannot be created for example. */
  createNewItems?: boolean
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
  input?: any
  ctx?: object
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ImportUpload = {
  id: string
}
export type ImportStatus = {
  created?: number
  updated?: number
  skipped?: number
  failed?: number
  failedItems?: {
    [key: string]: any
  }
  skippedItems?: {
    [key: string]: any
  }
  comments?: number
  entityListId?: string | null
  preview?: boolean
  phase?: 'validating' | 'importing'
}
export type ExistingItemStrategy = 'skip' | 'update' | 'fail'
export type MissingItemStrategy = 'create' | 'skip'
export type DuplicateItemStrategy = 'skip' | 'all'
export type ColumnValueMapping = {
  /** The source value from csv */
  source?: string | null
  /** The target value from csv */
  target?: string | null
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
