import { ImportData } from "@containers/ImportDialog/utils"
import {
  ColumnAction,
  ColumnMappings,
  ExtendedImportableColumn,
  ImportContext,
  ImportSchema,
  TargetValue,
  ValueMappableColumnMapping,
  ValueMappableColumnMappings,
  ValueMappings,
} from "../common"
import { preprocessRowsIfHierarchy } from "../hierarchy"
import { getValuesForColumn } from "./values"
import { getMapperState } from "./getMapperState"
import { resolvedStates } from "../MapperRow"

export const getMappingsToReview = (importSchema: ImportSchema, columnMappings: ColumnMappings) => {
  return Object.fromEntries(Object.entries(columnMappings)
    .filter(([, { action, targetColumn }]) => importSchema.some(
      ({ key }) => targetColumn === key && action !== ColumnAction.SKIP,
    ))
    .map(([column, mapping]) => [column, mapping as ValueMappableColumnMapping]))
}

export const getUniqueValuesForColumn = (
  importContext: ImportContext,
  columnSettings: Record<string, ExtendedImportableColumn>,
  data: ImportData,
  columnMappings: ColumnMappings,
  mappingsToReview: ValueMappableColumnMappings,
  mappings: ValueMappings | null,
) => {
  return Object.fromEntries(
    Object.keys(mappingsToReview)
      .map((column) => {
        const columnMapping = mappingsToReview[column]

        const rows = preprocessRowsIfHierarchy(
          importContext,
          column,
          columnMappings,
          mappings,
          data.rows,
        )

        const values = getValuesForColumn(
          rows,
          column,
          columnSettings[columnMapping.targetColumn],
        )

        return [
          column,
          Array.from(new Set(values))
        ]
      })
  )
}

export const getUnresolvedValues = (
  columnSettings: Record<string, ExtendedImportableColumn>,
  mappingsToReview: ValueMappableColumnMappings,
  uniqueValuesForColumn: Record<string, any[]>,
  mappings: ValueMappings | null,
) => {
  return Object.fromEntries(
    Object.entries(uniqueValuesForColumn).map(([column, uniqueValues]) => {
      const valuesSet = new Set(uniqueValues)
      if (!mappings) return [column, valuesSet]

      const settings = columnSettings[mappingsToReview[column].targetColumn]
      const resolvedValuesSet = new Set(uniqueValues
        .map((value) => [value, getMapperState(settings, column, `${value}`, mappings)])
        .filter(([, state]) => resolvedStates.has(state))
        .map(([c]) => c),
      )

      return [column, valuesSet.difference(resolvedValuesSet)]
    })
  )
}

export const getResolvedColumns = (
  mappingsToReview: ValueMappableColumnMappings,
  unresolvedValues: Record<string, Set<TargetValue>>,
) => {
  return Object
    .keys(mappingsToReview)
    .filter((column) => unresolvedValues[column].size === 0)
}
