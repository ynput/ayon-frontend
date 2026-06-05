import { ImportableColumn } from "@shared/api/generated/dataImport"
import { ColumnAction, ColumnMapping, ErrorHandlingMode, ImportSchema, normaliseForComparison } from "../common"

export const inferErrorHandling = (columnSchema: ImportableColumn) => {
  return columnSchema.errorHandlingModes[0] as ErrorHandlingMode
}

export const inferMapping = (column: string, schema: ImportSchema): ColumnMapping | null => {
  const normalisedColumn = normaliseForComparison(column)
  const columnSchema = schema.find((s) =>
    normalisedColumn === normaliseForComparison(s.key) ||
    normalisedColumn === normaliseForComparison(s.label)
  )

  if (!columnSchema) return null

  return {
    targetColumn: columnSchema.key,
    action: ColumnAction.MAP,
    errorHandlingMode: inferErrorHandling(columnSchema)
  }
}
