import { Column } from "primereact/column"

export type ImportContext = "hierarchy" | "users" | "list"

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

export enum ErrorHandlingMode {
  SKIP = "skip",
  ABORT = "abort",
  DEFAULT = "default",
}

export type StepProps<R> = {
  importContext: ImportContext
  onBack: () => void
  onNext: (result: R) => void
}

export type ColumnMapping = {
  action: ColumnAction
  targetColumn?: string
  errorHandlingMode?: ErrorHandlingMode
  userResolved?: boolean
}

export type ResolvedColumnMapping = ColumnMapping & {
  targetColumn: string
  errorHandlingMode: ErrorHandlingMode
}

export type ColumnMappings = Record<string, ColumnMapping>
export type ResolvedColumnMappings = Record<string, ResolvedColumnMapping>

export type ResolvedValueMappings = {}
