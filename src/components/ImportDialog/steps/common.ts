export type ImportContext = "hierarchy" | "users" | "list"

export enum ImportStep {
  UPLOAD,
  MAP_COLUMNS,
  REVIEW_VALUES,
  PREVIEW,
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
  targetColumn: string
  errorHandlingMode: ErrorHandlingMode
}

export type ColumnMappings = Record<string, ColumnMapping>
