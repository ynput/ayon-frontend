type Option = { value: string, label: string }

export const targetOptionCompareFn = (
  columnForTarget: Record<string, string>,
  requiredTargets: Set<string>,
) => (o1: Option, o2: Option) => {
  const bothMapped = columnForTarget[o1.value] && columnForTarget[o2.value]
  const neitherMapped = !columnForTarget[o1.value] && !columnForTarget[o2.value]
  if (bothMapped || neitherMapped) {
    const bothRequired = requiredTargets.has(o1.value) && requiredTargets.has(o2.value)
    const neitherRequired = !requiredTargets.has(o1.value) && !requiredTargets.has(o2.value)
    if (bothRequired || neitherRequired) {
      return o1.label.localeCompare(o2.label)
    }
    // push required targets to the very top
    if (requiredTargets.has(o1.value)) {
      return -1
    }
    return 1
  }

  return columnForTarget[o1.value] ? 1 : -1
}
