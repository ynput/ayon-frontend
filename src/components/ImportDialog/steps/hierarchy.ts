import { CSVRow } from "../utils";
import { ColumnMappings, ExtendedEnumItem, ImportContext, ImportSchema } from "./common";

export enum HierarchyEntityType {
  FOLDER = "folder",
  TASK = "task",
}

export const ENTITY_TYPE = "entity_type"
export const FOLDER_TYPE = "folder_type"
export const TASK_TYPE = "task_type"

export const FOLDER_TASK_TYPE_COMBINED_COLUMN = "folder_or_task_type"
export const FOLDER_TASK_TYPE_VALUE_SEPARATOR = ":|:|:|:"

export const entityTypeDependentColumns = new Set([FOLDER_TYPE, TASK_TYPE])

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

const getHierarchyRowFilter = (
  column: string,
  entityTypeSourceColumn: string,
) => {
  switch (column) {
    case FOLDER_TYPE:
      return (row: CSVRow) => row[entityTypeSourceColumn] === HierarchyEntityType.FOLDER
    case TASK_TYPE:
    default:
      return (row: CSVRow) => row[entityTypeSourceColumn] === HierarchyEntityType.TASK
  }
}

// For hierarchy imports, we have special rules around how folder/task type columns
// are interpreted. This function prepares the CSV rows so that the entity type column
// is considered when interpreting the folder type, task type, and the combined folder/task type columns.
export const preprocessRowsIfHierarchy = (
  importContext: ImportContext,
  column: string,
  columnMappings: ColumnMappings,
  rows: CSVRow[],
) => {
  const entityTypeSource = getEntityTypeSource(importContext, columnMappings)
  if (entityTypeSource) {
    const columnMapping = columnMappings[column]

    if (columnMapping.targetColumn && entityTypeDependentColumns.has(columnMapping.targetColumn)) {
      return rows.filter(getHierarchyRowFilter(column, entityTypeSource))
    } else if (columnMapping.targetColumn === FOLDER_TASK_TYPE_COMBINED_COLUMN) {
      return rows.map((row) => ({
        ...row,
        [column]: encodeUniqueFolderTaskType(row[entityTypeSource], row[column]),
      }))
    }
  }

  return rows
}
