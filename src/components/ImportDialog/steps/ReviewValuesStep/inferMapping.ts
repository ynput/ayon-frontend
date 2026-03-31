import { ImportableColumn } from "@shared/api/generated/dataImport"
import { normaliseForComparison, ValueAction, ValueMapping } from "../common"

const truthyBooleanStrings = new Set(["true", "yes", "1", "on", "ano", "ja", "si"])
const falsyBooleanStrings = new Set(["false", "no", "0", "off", "ne", "nein", "no"])

export const inferMapping = (value: string, settings: ImportableColumn): ValueMapping | null => {
  const normalisedValue = normaliseForComparison(value)
  if (settings.valueType === "boolean") {
    if (truthyBooleanStrings.has(normalisedValue)) {
      return {
        action: ValueAction.MAP,
        targetValue: true,
      }
    } else if (falsyBooleanStrings.has(normalisedValue)) {
      return {
        action: ValueAction.MAP,
        targetValue: false,
      }
    } else {
      return {
        action: ValueAction.SKIP,
        targetValue: false,
      }
    }
  }

  // for non-enum columns, we default to creating a new value
  if (!settings.enumItems) {
    return {
      action: ValueAction.CREATE,
      targetValue: value,
    }
  }

  const inferredEnum = settings.enumItems?.find((e) =>
    normalisedValue === normaliseForComparison(`${e.value}`) ||
    normalisedValue === normaliseForComparison(e.label)
  )

  if (!inferredEnum) return null

  return {
    targetValue: `${inferredEnum.value}`,
    action: ValueAction.MAP,
  }
}
