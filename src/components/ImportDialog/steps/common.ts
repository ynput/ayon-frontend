import { EnumItem, ExportFieldsApiArg, ImportableColumn } from "@shared/api/generated/dataImport"

export type ImportContext = ExportFieldsApiArg["entityType"]

export type ExtendedEnumItem = EnumItem & {
  entityType?: "folder" | "task"
}

export type ExtendedImportableColumn = ImportableColumn & {
  enumItems?: ExtendedEnumItem[]
}

export type ImportSchema = ExtendedImportableColumn[]

export enum ImportStep {
  UPLOAD,
  MAP_COLUMNS,
  REVIEW_VALUES,
  PREVIEW,
  SUBMIT,
}

export enum ColumnAction {
  MAP = "map",
  SKIP = "skip",
}

export enum ValueAction {
  MAP = "map",
  SKIP = "skip",
  CREATE = "create",
}

export enum ErrorHandlingMode {
  SKIP = "skip",
  ABORT = "abort",
  DEFAULT = "default",
}

export type StepProps<R> = {
  importContext: ImportContext
  onBack: (result?: R) => void
  onNext: (result: R) => void
}

export type TargetColumn = string

export type ColumnMapping = {
  action: ColumnAction
  targetColumn?: TargetColumn
  errorHandlingMode?: ErrorHandlingMode
  userResolved?: boolean
}

export type ValueMappableColumnMapping = ColumnMapping & {
  targetColumn: string
  errorHandlingMode: ErrorHandlingMode
}

export type ColumnMappings = Record<string, ColumnMapping>
export type ValueMappableColumnMappings = Record<string, ValueMappableColumnMapping>

export type TargetValue = string | boolean

export type ValueMapping = {
  action: ValueAction
  targetValue: TargetValue
  userResolved?: boolean
}

export type ValueMappings = Record<string, Record<string, ValueMapping>>

// Can be applied to two strings to compare them with some tolerance
// e.g. case-insensitive and ignoring certain characters.
export const normaliseForComparison = (name: string) => name
  .replace(/[_\.\*\s]|attrib\.|data\./g, '')
  .toLowerCase();

export const itemsLabelForImportContext: Record<ImportContext, string> = {
  hierarchy: "folders and tasks",
  user: "users",
  folder: "folders",
  task: "tasks",
  entity_list_item: "list items",
}

export const contextLabelForImportContext: Record<ImportContext, string> = {
  hierarchy: "Hierarchy",
  user: "Users",
  folder: "Folders",
  task: "Tasks",
  entity_list_item: "List items",
}

export type ImportDataStartSummary = {
  total: number
  type: string
}

export type ImportDataProcessSummary = {
  created: number
  updated: number
  skipped: number
  failed: number
  failedItems?: Record<string, string>
}

export type ImportDataMessage = {
  summary: ImportDataStartSummary | ImportDataProcessSummary
}

export const formatFailedItems = (failedItems: Record<string, string>) => Object.entries(failedItems)
  .map(([key, reason]) => `- ${key || '(empty)'}: ${reason}`)
  .join('\n')
