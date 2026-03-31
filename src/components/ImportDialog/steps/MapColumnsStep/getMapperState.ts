import { MappingState } from "../ColumnMapper"
import { ColumnAction, ColumnMappings } from "../common"

export const getMapperState = (column: string, mappings: ColumnMappings = {}) => {
  const mapping = mappings[column]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap = mapping.action === ColumnAction.MAP && mapping.targetColumn
  const resolvedToSkip = mapping.action === ColumnAction.SKIP
  if (resolvedToMap || resolvedToSkip) {
    return mapping.userResolved ? MappingState.RESOLVED : MappingState.AUTO_RESOLVED
  }

  return MappingState.UNRESOLVED
}
