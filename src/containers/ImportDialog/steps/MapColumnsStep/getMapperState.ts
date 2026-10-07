import { MappingState } from "../MapperRowHelpers"
import { ColumnAction, ColumnMappings } from "../common"

// A mapping to a target the schema no longer offers (e.g. after changing the
// import options) needs to be resolved again.
export const getMapperState = (
  column: string,
  mappings: ColumnMappings = {},
  targetExists: (target: string) => boolean = () => true,
) => {
  const mapping = mappings[column]
  if (!mapping) return MappingState.UNRESOLVED

  const resolvedToMap =
    mapping.action === ColumnAction.MAP && mapping.targetColumn && targetExists(mapping.targetColumn)
  const resolvedToSkip = mapping.action === ColumnAction.SKIP
  if (resolvedToMap || resolvedToSkip) {
    return mapping.userResolved ? MappingState.RESOLVED : MappingState.AUTO_RESOLVED
  }

  return MappingState.UNRESOLVED
}
