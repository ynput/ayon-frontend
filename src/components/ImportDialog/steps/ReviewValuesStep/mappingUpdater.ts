import { cloneDeep, merge } from "lodash"
import { ValueMapping, ValueMappings } from "../common"

export const mappingUpdater = (
  column: string,
  values: string[],
  update: Partial<ValueMapping>,
  callback?: (mappings: ValueMappings) => void,
) => (old: ValueMappings | null) => {
  const base = old ?? {}
  const columnBase = base[column] ?? {}

  const updated = values.map((value: string) => ({
    [value]: {
      ...(columnBase[value] ?? { }),
      ...update,
      userResolved: true,
    },
  }))

  const mappings = {
    ...cloneDeep(base),
    [column]: merge(
      cloneDeep(columnBase),
      ...updated,
    ),
  }

  callback?.(mappings)
  return mappings
}
