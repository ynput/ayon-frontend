import { CSVRow } from "../utils";
import { ImportSchema } from "./common";

export const ENTITY_TYPE = "entity_type"
export const FOLDER_TYPE = "folder_type"
export const TASK_TYPE = "task_type"

export const entityTypeDependentColumns = new Set([FOLDER_TYPE, TASK_TYPE])

export const getHierarchyRowFilter = (
  column: string,
  entityTypeSourceColumn: string,
) => {
  switch (column) {
    case FOLDER_TYPE:
      return (row: CSVRow) => row[entityTypeSourceColumn] === "folder"
    case TASK_TYPE:
    default:
      return (row: CSVRow) => row[entityTypeSourceColumn] === "task"
  }
}

// this isn't supposed to be sent to the server
export const FOLDER_TASK_TYPE_COMBINED_COLUMN = "__internal_folder_and_task_type__"

export const withHierarchySchema = (original?: ImportSchema) => {
  if (!original) return undefined

  return original.concat([
    // TODO: remove this once server returns it
    {
      key: "entity_type",
      label: "Entity type",
      required: true,
      valueType: "string",
      defaultValue: "",
      enumItems: [
        {
          value: "folder",
          label: "Folder",
        },
        {
          value: "task",
          label: "Task",
        },
      ],
      errorHandlingModes: [
        "abort",
      ]
    },

    {
      key: FOLDER_TASK_TYPE_COMBINED_COLUMN,
      label: "Folder/task type (combined)",
      required: false,
      valueType: "string",
      defaultValue: "",
      errorHandlingModes: [
        "skip",
        "abort",
      ]
    }
  ])
}
