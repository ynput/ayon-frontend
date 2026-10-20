import { ImportableColumn } from "@shared/api/generated/dataImport"
import { ColumnAction, ColumnMapping, ErrorHandlingMode, ImportSchema, normaliseForComparison } from "../common"

export const inferErrorHandling = (columnSchema: ImportableColumn) => {
  return columnSchema.errorHandlingModes[0] as ErrorHandlingMode
}

// Column names of the project table's copy and export that differ from the import targets,
// the first target the schema offers is used.
const columnAliases: Record<string, string[]> = {
  subtype: ["folder_or_task_type", "folder_type", "task_type"],
  path: ["path", "folder_path"],
}

export const inferMapping = (column: string, schema: ImportSchema): ColumnMapping | null => {
  const normalisedColumn = normaliseForComparison(column)
  const columnSchema = schema.find((s) =>
    normalisedColumn === normaliseForComparison(s.key) ||
    normalisedColumn === normaliseForComparison(s.label)
  ) ?? columnAliases[normalisedColumn]
    ?.map((key) => schema.find((s) => s.key === key))
    .find(Boolean)

  if (!columnSchema) return null

  return {
    targetColumn: columnSchema.key,
    action: ColumnAction.MAP,
    errorHandlingMode: inferErrorHandling(columnSchema)
  }
}
