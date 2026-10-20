import { ExtendedEnumItem, ExtendedImportableColumn, normaliseForComparison, ValueAction, ValueMapping } from "../common"
import { DateOrder, localeDateOrder, parseDate } from "./dates"

const truthyBooleanStrings = new Set(["true", "yes", "1", "on", "ano", "ja", "si"])
const falsyBooleanStrings = new Set(["false", "no", "0", "off", "ne", "nein", "no"])

export const inferMapping = (
  value: string,
  settings: ExtendedImportableColumn,
  entityType?: ExtendedEnumItem["entityType"],
  dateOrder?: DateOrder,
): ValueMapping | null => {
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

  // dates are converted to ISO, unreadable ones are kept so they show as invalid
  if (settings.valueType === "datetime") {
    return {
      action: ValueAction.CREATE,
      targetValue: parseDate(value, dateOrder ?? localeDateOrder()) ?? value,
    }
  }

  // for non-enum columns, we default to creating a new value
  if (!settings.enumItems) {
    return {
      action: ValueAction.CREATE,
      targetValue: value,
    }
  }

  const inferredEnum = settings.enumItems
    ?.filter((item: ExtendedEnumItem) => !item.entityType || item.entityType === entityType)
    .find((e) =>
      normalisedValue === normaliseForComparison(`${e.value}`) ||
      normalisedValue === normaliseForComparison(e.label)
    )

  if (!inferredEnum) return null

  return {
    targetValue: `${inferredEnum.value}`,
    action: ValueAction.MAP,
  }
}
