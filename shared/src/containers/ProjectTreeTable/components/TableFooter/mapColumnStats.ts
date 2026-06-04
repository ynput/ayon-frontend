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

const snakeToCamel = (s: string): string => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())

// Per-entity "type" columns all map to the unified `subType` column in the table.
// (`product_base_type` is a separate column — productBaseType — so not aliased.)
const COLUMN_ALIASES: Record<string, string> = {
  task_type: 'subType',
  folder_type: 'subType',
  product_type: 'subType',
}

// Canonical frontend column id for a backend column name. Attribute columns keep
// their `attrib_` form; everything else is snake_case on the backend but camelCase
// in the table (product_base_type → productBaseType, created_at → createdAt).
const canonicalColumnId = (name: string): string => {
  if (name in COLUMN_ALIASES) return COLUMN_ALIASES[name]
  if (name.startsWith('project_attributes_')) {
    return 'attrib_' + name.slice('project_attributes_'.length)
  }
  if (name.startsWith('attrib_')) return name
  return snakeToCamel(name)
}

const normName = canonicalColumnId

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

const toColumnId = canonicalColumnId

const sumN = (a?: number | null, b?: number | null): number | undefined =>
  a == null && b == null ? undefined : (a ?? 0) + (b ?? 0)
const lowest = <T,>(a?: T | null, b?: T | null): T | undefined =>
  a == null ? b ?? undefined : b == null ? a : a < b ? a : b
const highest = <T,>(a?: T | null, b?: T | null): T | undefined =>
  a == null ? b ?? undefined : b == null ? a : a > b ? a : b
const pct = (part?: number, rest?: number): number | undefined =>
  part != null && rest != null && part + rest > 0
    ? Math.round((part / (part + rest)) * 10000) / 100
    : undefined

// Additive combine of one column's stats from two entity sets (e.g. folder +
// task). Counts sum, min/max widen, percentages recompute, avg is weighted by
// filled counts when available.
const combineTwo = (a: FieldStats, b: FieldStats): FieldStats => {
  const filled = sumN(a.valueFilledCount, b.valueFilledCount)
  const notFilled = sumN(a.valueNotFilledCount, b.valueNotFilledCount)
  const checked = sumN(a.checkedCount, b.checkedCount)
  const notChecked = sumN(a.notCheckedCount, b.notCheckedCount)

  let avg: number | undefined
  if (a.avg != null && b.avg != null) {
    const wa = a.valueFilledCount
    const wb = b.valueFilledCount
    avg =
      wa != null && wb != null && wa + wb > 0
        ? (a.avg * wa + b.avg * wb) / (wa + wb)
        : (a.avg + b.avg) / 2
    avg = Math.round(avg * 100) / 100
  } else {
    avg = a.avg ?? b.avg ?? undefined
  }

  let distribution: FieldStats['distribution']
  if (a.distribution?.length || b.distribution?.length) {
    const byValue = new Map<string, NonNullable<FieldStats['distribution']>[number]>()
    for (const d of [...(a.distribution ?? []), ...(b.distribution ?? [])]) {
      const prev = byValue.get(d.value)
      byValue.set(d.value, prev ? { ...prev, count: prev.count + d.count } : { ...d })
    }
    distribution = [...byValue.values()]
  }

  return {
    columnName: a.columnName,
    min: lowest(a.min, b.min),
    max: highest(a.max, b.max),
    avg,
    sum: sumN(a.sum, b.sum),
    valueFilledCount: filled,
    valueNotFilledCount: notFilled,
    percentageFilled: pct(filled, notFilled),
    percentageNotFilled: pct(notFilled, filled),
    checkedCount: checked,
    notCheckedCount: notChecked,
    checkedPercentage: pct(checked, notChecked),
    notCheckedPercentage: pct(notChecked, checked),
    distribution,
    folderCount: a.folderCount ?? b.folderCount,
    taskCount: a.taskCount ?? b.taskCount,
  }
}

// Combine primary-entity stats (tasks/versions) with group-entity stats
// (folders/products) for the "include groups & folders" row scope.
export const combineFieldStats = (
  primary: FieldStats[],
  group: FieldStats[] = [],
): FieldStats[] => {
  const byId = new Map<string, FieldStats>()
  for (const s of primary) byId.set(normName(s.columnName), s)
  const out = new Map(byId)
  for (const g of group) {
    const id = normName(g.columnName)
    const p = byId.get(id)
    out.set(id, p ? combineTwo(p, g) : g)
  }
  return [...out.values()]
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
