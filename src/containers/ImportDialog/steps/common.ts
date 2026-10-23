import { EnumItem, ExportFieldsApiArg, ImportableColumn } from "@shared/api/generated/dataImport"
import type { StatsItem } from "./Stats"

export type ImportContext = ExportFieldsApiArg["entityType"]

export type ExtendedEnumItem = EnumItem & {
  entityType?: "folder" | "task"
}

export type ExtendedImportableColumn = ImportableColumn & {
  enumItems?: ExtendedEnumItem[]
}

export type ImportSchema = ExtendedImportableColumn[]

// An empty comment category means no category, so it doesn't need to be reviewed
export const COMMENT_CATEGORY = "comment_category"

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
// The project table names attribute columns attrib_name when copying or exporting.
export const normaliseForComparison = (name: string) => name
  .replace(/^(attrib|data)[._]/i, '')
  .replace(/[_.*\s]/g, '')
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
  skippedItems?: Record<string, string>
  comments?: number
  phase: string
}

export type ImportDataMessage = {
  summary: ImportDataStartSummary | ImportDataProcessSummary
  progress: number
  description?: string
  status: string
}

export const formatFailedItems = (failedItems: Record<string, string>) => Object.entries(failedItems)
  .map(([key, reason]) => `- ${key || '(empty)'}: ${reason}`)
  .join('\n')

type ImportCounts = {
  created?: number
  updated?: number
  skipped?: number
  failed?: number
  comments?: number
  failedItems?: object
  skippedItems?: object
}

// Rows with errors are skipped too, `failed` only counts the ones that aborted the import,
// so errors are counted from the listed problems.
export const getImportStatsItems = (counts: ImportCounts, done: boolean): StatsItem[] => {
  const failedItems = (counts.failedItems ?? {}) as Record<string, string>
  const errors = Math.max(counts.failed ?? 0, Object.keys(failedItems).length)
  const items: StatsItem[] = [
    { text: `${done ? "Created" : "Creating"}: ${counts.created ?? 0}`, icon: "add" },
    { text: `${done ? "Updated" : "Updating"}: ${counts.updated ?? 0}`, icon: "difference" },
  ]
  if (counts.comments) {
    items.push({ text: `Comments: ${counts.comments}`, icon: "chat" })
  }
  items.push(
    {
      text: `${done ? "Skipped" : "Skipping"}: ${counts.skipped ?? 0}`,
      icon: "do_not_disturb",
      tooltip: counts.skippedItems && formatFailedItems(counts.skippedItems as Record<string, string>),
    },
    {
      text: `Errors: ${errors}`,
      icon: "error",
      danger: errors > 0,
      tooltip: errors ? formatFailedItems(failedItems) : undefined,
    },
  )
  return items
}
