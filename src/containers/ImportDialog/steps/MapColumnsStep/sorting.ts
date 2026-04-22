import { ImportableColumn } from "@shared/api/generated/dataImport"

type Option = { value: string, label: string }

export const targetOptionCompareFn = (
  columnForTarget: Record<string, string>,
  columnSettings: Record<string, ImportableColumn>,
) => (o1: Option, o2: Option) => {
  const bothMapped = columnForTarget[o1.value] && columnForTarget[o2.value]
  const neitherMapped = !columnForTarget[o1.value] && !columnForTarget[o2.value]
  if (bothMapped || neitherMapped) {
    const bothRequired = columnSettings[o1.value].required && columnSettings[o2.value].required
    const neitherRequired = !columnSettings[o1.value].required && !columnSettings[o2.value].required
    if (bothRequired || neitherRequired) {
      return o1.label.localeCompare(o2.label)
    }
    // push required targets to the very top
    if (columnSettings[o1.value].required) {
      return -1
    }
    return 1
  }

  return columnForTarget[o1.value] ? 1 : -1
}
