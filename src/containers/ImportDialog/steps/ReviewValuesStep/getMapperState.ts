import { ImportableColumn } from "@shared/api/generated/dataImport"
import { TargetValue, ValueAction, ValueMappings } from "../common"
import { MappingState } from "../MapperRow"

const validateValue = (settings: ImportableColumn, value: TargetValue) => {
  if (typeof value === "boolean") {
    return settings.valueType === "boolean"
  }

  switch (settings.valueType) {
    case "integer":
      return /[0-9]+/.test(value)
    case "boolean":
      return /true|false/i.test(value)
    case "float":
      return !Number.isNaN(parseFloat(value))
    case "string":
    // we don't know how to validate the types below - yet!
    case "dict":
    case "datetime":
    case "list_of_strings":
    case "list_of_any":
    case "list_of_integers":
    case "list_of_submodels":
    default:
      return true
  }
}

export const getMapperState = (
  settings: ImportableColumn,
  column: string | null,
  value: string,
  mappings: ValueMappings | null,
) => {
  if (!column || !mappings) return MappingState.UNRESOLVED

  const mapping = mappings[column]?.[value]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ValueAction.MAP
    && (settings.valueType === "boolean" || mapping.targetValue)

  const resolvedToSkip = mapping.action === ValueAction.SKIP
  const resolvedToCreate = mapping.action === ValueAction.CREATE
  if (resolvedToMap || resolvedToSkip || resolvedToCreate) {
    if (resolvedToCreate && !validateValue(settings, mapping.targetValue)) {
      return MappingState.ERROR
    }

    return mapping.userResolved ? MappingState.RESOLVED : MappingState.AUTO_RESOLVED
  }

  return MappingState.UNRESOLVED
}
