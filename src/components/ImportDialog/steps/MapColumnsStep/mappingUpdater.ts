import { cloneDeep, merge } from "lodash"
import { ColumnMapping, ColumnMappings } from "../common"

export const mappingUpdater = (
  columns: string[],
  update: Partial<ColumnMapping>,
  fallback: Partial<ColumnMapping> = {},
  callback?: (mappings: ColumnMappings) => void,
) => (old: ColumnMappings | undefined) => {
  const base = old ?? {}

  const updated = columns.map((column: string) => ({
    [column]: {
      ...fallback,
      ...(base[column] ?? {}),
      ...update,
      userResolved: true,
    }
  }))

  const mappings = merge(
    cloneDeep(base),
    ...updated,
  )

  callback?.(mappings)

  return mappings
}
