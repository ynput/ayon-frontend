import { ColumnSummary, ColumnSummaryMap, SummaryDistributionItem } from './summaryTypes'

// Shape of the backend GraphQL `ColumnStats` (connection.fieldStats).
// `sum` and `distribution` are pending backend work (see ayon-backend handoff)
// but typed here so wiring is a no-op once they land.
export type FieldStats = {
  columnName: string
  // numeric for number columns, ISO date string for datetime columns
  min?: number | string | null
  max?: number | string | null
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
  // main/count column: separate folder and task totals over the filtered set
  folderCount?: number | null
  taskCount?: number | null
}

const nn = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v)

const normName = (name: string): string =>
  name.startsWith('project_attributes_') ? 'attrib_' + name.slice('project_attributes_'.length) : name

// Overlay live stats onto mock, per column and per field: live's non-null
// values win, mock fills any field (or whole column) the backend doesn't return.
export const mergeFieldStats = (
  live: FieldStats[] = [],
  mock: FieldStats[] = [],
): FieldStats[] => {
  const byId = new Map<string, FieldStats>()
  for (const s of mock) byId.set(normName(s.columnName), { ...s })
  for (const s of live) {
    const id = normName(s.columnName)
    const merged: FieldStats = { ...(byId.get(id) || { columnName: s.columnName }) }
    for (const [k, v] of Object.entries(s)) {
      if (v !== null && v !== undefined) (merged as any)[k] = v
    }
    byId.set(id, merged)
  }
  return [...byId.values()]
}

// Bridge backend column names to frontend column ids. Backend exposes attribute
// columns as `project_attributes_<x>` / `attrib_<x>`; the table uses `attrib_<x>`.
const toColumnId = (backendName: string): string => {
  if (backendName.startsWith('project_attributes_')) {
    return 'attrib_' + backendName.slice('project_attributes_'.length)
  }
  return backendName
}

const mapDistribution = (
  dist: FieldStats['distribution'],
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

export const mapColumnStatsToSummary = (stats: FieldStats[]): ColumnSummaryMap => {
  const map: ColumnSummaryMap = {}
  for (const s of stats) {
    const columnId = toColumnId(s.columnName)
    // min/max are numbers for number columns, ISO strings for datetime columns
    const minIsDate = typeof s.min === 'string'
    const maxIsDate = typeof s.max === 'string'
    const summary: ColumnSummary = {
      columnId,
      min: typeof s.min === 'number' ? s.min : undefined,
      max: typeof s.max === 'number' ? s.max : undefined,
      minDate: minIsDate ? (s.min as string) : undefined,
      maxDate: maxIsDate ? (s.max as string) : undefined,
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
      folderCount: nn(s.folderCount),
      taskCount: nn(s.taskCount),
    }
    summary.total = deriveTotal(summary)
    map[columnId] = summary
  }
  return map
}
