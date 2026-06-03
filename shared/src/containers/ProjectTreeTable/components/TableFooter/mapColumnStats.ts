import { ColumnSummary, ColumnSummaryMap, SummaryDistributionItem } from './summaryTypes'

// Shape of the backend GraphQL `ColumnStats` (connection.fieldStats).
// `sum` and `distribution` are pending backend work (see ayon-backend handoff)
// but typed here so wiring is a no-op once they land.
export type BackendColumnStats = {
  columnName: string
  min?: number | null
  max?: number | null
  avg?: number | null
  sum?: number | null
  valueFilledCount?: number | null
  percentageFilled?: number | null
  valueNotFilledCount?: number | null
  percentageNotFilled?: number | null
  checkedCount?: number | null
  checkedPercentage?: number | null
  notCheckedCount?: number | null
  notCheckedPercentage?: number | null
  distribution?: { value: string; label?: string | null; color?: string | null; count: number }[] | null
}

const nn = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v)

// Bridge backend column names to frontend column ids. Backend exposes attribute
// columns as `project_attributes_<x>` / `attrib_<x>`; the table uses `attrib_<x>`.
const toColumnId = (backendName: string): string => {
  if (backendName.startsWith('project_attributes_')) {
    return 'attrib_' + backendName.slice('project_attributes_'.length)
  }
  return backendName
}

const mapDistribution = (
  dist: BackendColumnStats['distribution'],
): SummaryDistributionItem[] | undefined =>
  dist?.map((d) => ({
    value: d.value,
    label: nn(d.label),
    color: nn(d.color),
    count: d.count,
  }))

const deriveTotal = (s: ColumnSummary): number | undefined => {
  if (s.distribution) return s.distribution.reduce((a, d) => a + d.count, 0)
  if (s.filledCount != null && s.notFilledCount != null) return s.filledCount + s.notFilledCount
  if (s.checkedCount != null && s.notCheckedCount != null)
    return s.checkedCount + s.notCheckedCount
  return undefined
}

export const mapColumnStatsToSummary = (stats: BackendColumnStats[]): ColumnSummaryMap => {
  const map: ColumnSummaryMap = {}
  for (const s of stats) {
    const columnId = toColumnId(s.columnName)
    const summary: ColumnSummary = {
      columnId,
      min: nn(s.min),
      max: nn(s.max),
      avg: nn(s.avg),
      sum: nn(s.sum),
      filledCount: nn(s.valueFilledCount),
      notFilledCount: nn(s.valueNotFilledCount),
      percentageFilled: nn(s.percentageFilled),
      percentageNotFilled: nn(s.percentageNotFilled),
      checkedCount: nn(s.checkedCount),
      notCheckedCount: nn(s.notCheckedCount),
      percentageChecked: nn(s.checkedPercentage),
      percentageNotChecked: nn(s.notCheckedPercentage),
      distribution: mapDistribution(s.distribution),
    }
    summary.total = deriveTotal(summary)
    map[columnId] = summary
  }
  return map
}
