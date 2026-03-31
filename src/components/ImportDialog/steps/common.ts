import { ExportFieldsApiArg, ExportFieldsApiResponse } from "@shared/api/generated/dataImport"

export type ImportContext = ExportFieldsApiArg["entityType"]

export type ImportSchema = ExportFieldsApiResponse

export enum ImportStep {
  UPLOAD,
  MAP_COLUMNS,
  REVIEW_VALUES,
  PREVIEW,
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
  ABORT = "fail",
  DEFAULT = "update",
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

// can be applied to two strings to compare them with some tolerance
// e.g. case-insensitive and ignoring certain characters
export const normaliseForComparison = (name: string) => name.replace(/_\.\s/g, '').toLowerCase();

export const itemsLabelForImportContext: Record<ImportContext, string> = {
  hierarchy: "folders and tasks",
  user: "users",
  folder: "folders",
  task: "tasks",
  // TODO: add this once lists are supported in the backend
  // list: "items",
}
