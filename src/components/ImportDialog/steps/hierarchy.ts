import { CSVRow } from "../utils";
import { ColumnMappings, ExtendedEnumItem, ImportContext, ImportSchema, ValueMappings } from "./common";

export enum HierarchyEntityType {
  FOLDER = "folder",
  TASK = "task",
}

export const ENTITY_TYPE = "entity_type"
export const FOLDER_TYPE = "folder_type"
export const TASK_TYPE = "task_type"

export const FOLDER_TASK_TYPE_COMBINED_COLUMN = "folder_or_task_type"
export const FOLDER_TASK_TYPE_VALUE_SEPARATOR = ":|:|:|:"
export const FALLBACK_ENTITY_TYPE = "(unknown)"

export const entityTypeDependentColumns = new Set([FOLDER_TYPE, TASK_TYPE])

// some columns can only be value-mapped if another column has been value mapped
const valueMappingDependencies: Record<string, string[]> = {
  [FOLDER_TASK_TYPE_COMBINED_COLUMN]: [ENTITY_TYPE],
  [TASK_TYPE]: [ENTITY_TYPE],
  [FOLDER_TYPE]: [ENTITY_TYPE],
}

export const getValueMappingDependencies = (
  importContext: ImportContext,
  targetColumn: string,
): Set<string> => {
  if (importContext !== "hierarchy") return new Set()

  return new Set(valueMappingDependencies[targetColumn])
}

// If a combined folder/task type column is returned in the hierarchy schema,
// we grab its enum items from the individual folder type/task type columns,
// labelling them with the appropriate entity type so they can be filtered
// in the value mapping dropdowns.
export const withHierarchySchema = (original?: ImportSchema): ImportSchema | undefined => {
  if (!original) return

  const folderTypeColumn = original.find(({ key }) => key === FOLDER_TYPE)
  const taskTypeColumn = original.find(({ key }) => key === TASK_TYPE)

  // this shouldn't happen, so return undefined so an error message is shown
  if (!folderTypeColumn || !taskTypeColumn) return

  return original.map((settings) => {
    if (settings.key !== FOLDER_TASK_TYPE_COMBINED_COLUMN) {
      return settings
    }

    const folderTypeEnumItems = (folderTypeColumn.enumItems ?? []).map((item) => ({
      ...item,
      entityType: HierarchyEntityType.FOLDER,
    }))

    const taskTypeEnumItems = (taskTypeColumn.enumItems ?? []).map((item) => ({
      ...item,
      entityType: HierarchyEntityType.TASK,
    }))

    return {
      ...settings,
      enumItems: folderTypeEnumItems.concat(taskTypeEnumItems) as ExtendedEnumItem[]
    }
  })
}

const getEntityTypeSource = (importContext: ImportContext, columnMappings: ColumnMappings) => {
  if (importContext !== "hierarchy" || !columnMappings) return

  const entry = Object.entries(columnMappings)
    .find(([, mapping]) => mapping.targetColumn === ENTITY_TYPE)
  if (!entry) return

  return entry[0]
}

// For hierarchy imports, there might be a combined folder/task type column which needs
// to be interpreted in a special way based on its entity type. When constructing the value mapping,
// we format the found unique value to include the entity type and a special separator.
const encodeUniqueFolderTaskType = (entityType: HierarchyEntityType, value: string) => [entityType, value]
  .join(FOLDER_TASK_TYPE_VALUE_SEPARATOR)

// The formatted value can then be parsed safely using this function.
export const parseUniqueValueIfHierarchy = (targetColumn: string | null, value: string) => {
  if (targetColumn !== FOLDER_TASK_TYPE_COMBINED_COLUMN) {
    return { source: value }
  }

  const [part1, part2] = !!value
    ? value.split(FOLDER_TASK_TYPE_VALUE_SEPARATOR)
    : [undefined, value]

  return {
    source: (part2 ?? part1) as string,
    entityType: (part2 ? part1 : undefined) as HierarchyEntityType | undefined,
  }
}

// For a column dependent on the entity type column,
// attempts to find the actual entity type based on the existing value mappings.
const getEntityTypeForMappings = (
  row: CSVRow,
  mappings: ValueMappings | null,
  entityTypeSource: string,
) => mappings
    ?.[entityTypeSource]
    ?.[row[entityTypeSource]]
    ?.targetValue
    ?? FALLBACK_ENTITY_TYPE

const getHierarchyRowFilter = (
  column: string,
  entityTypeSource: string,
  mappings: ValueMappings | null,
) => {
  switch (column) {
    case FOLDER_TYPE:
      return (row: CSVRow) => {
        return getEntityTypeForMappings(row, mappings, entityTypeSource) === HierarchyEntityType.FOLDER
      }
    case TASK_TYPE:
    default:
      return (row: CSVRow) => {
        return getEntityTypeForMappings(row, mappings, entityTypeSource) === HierarchyEntityType.TASK
      }
  }
}

// For hierarchy imports, we have special rules around how folder/task type columns
// are interpreted. This function prepares the CSV rows so that the entity type column
// is considered when interpreting the folder type, task type, and the combined folder/task type columns.
export const preprocessRowsIfHierarchy = (
  importContext: ImportContext,
  column: string,
  columnMappings: ColumnMappings,
  mappings: ValueMappings | null,
  rows: CSVRow[],
) => {
  const entityTypeSource = getEntityTypeSource(importContext, columnMappings)
  if (entityTypeSource) {
    const columnMapping = columnMappings[column]

    if (columnMapping.targetColumn && entityTypeDependentColumns.has(columnMapping.targetColumn)) {
      return rows.filter(getHierarchyRowFilter(column, entityTypeSource, mappings))
    } else if (columnMapping.targetColumn === FOLDER_TASK_TYPE_COMBINED_COLUMN) {
      return rows.map((row) => {
        const entityType = getEntityTypeForMappings(row, mappings, entityTypeSource)
        return {
          ...row,
          [column]: encodeUniqueFolderTaskType(entityType as HierarchyEntityType, row[column]),
        }
      })
    }
  }

  return rows
}
