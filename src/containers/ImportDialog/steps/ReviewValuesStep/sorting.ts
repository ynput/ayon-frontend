import { ValueMappableColumnMapping } from "../common"

type SortEntry = [string, ValueMappableColumnMapping]

export const sortMappingsToReviewEntries = (resolvedColumns: string[]) => ([m1]: SortEntry, [m2]: SortEntry) => {
  const m1Resolved = resolvedColumns.includes(m1)
  const m2Resolved = resolvedColumns.includes(m2)
  if (m1Resolved && m2Resolved || (!m1Resolved && !m2Resolved)) {
    return m1.localeCompare(m2)
  }

  return m1Resolved ? 1 : -1
}
