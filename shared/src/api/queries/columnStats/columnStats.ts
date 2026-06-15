// Shape of the backend GraphQL `ColumnStats` (connection.fieldStats).
// `sum` and `distribution` are typed ahead of backend support so wiring them is a no-op.
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
  distribution?:
    | { value: string; label?: string | null; color?: string | null; count: number }[]
    | null
  // main/count column: primary/secondary entity totals (folders/tasks, products/versions)
  primaryCount?: number | null
  secondaryCount?: number | null
}

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
export const canonicalColumnId = (name: string): string => {
  if (name in COLUMN_ALIASES) return COLUMN_ALIASES[name]
  if (name.startsWith('project_attributes_')) {
    return 'attrib_' + name.slice('project_attributes_'.length)
  }
  if (name.startsWith('inherited_attributes_')) {
    return 'attrib_' + name.slice('inherited_attributes_'.length)
  }
  if (name.startsWith('attrib_')) return name
  return snakeToCamel(name)
}

const normalizeDistribution = (raw: unknown): FieldStats['distribution'] => {
  if (raw == null) return undefined
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return undefined
    }
  }
  if (Array.isArray(value)) {
    // dedupe by value; array buckets (tags/assignees combos) unnest per value
    const byValue = new Map<string, { value: string; count: number }>()
    for (const d of value) {
      if (!d || d.value == null) continue
      const vals = Array.isArray(d.value) ? d.value : [d.value]
      for (const raw of vals) {
        const v = String(raw)
        const prev = byValue.get(v)
        byValue.set(v, { ...d, value: v, count: (prev?.count ?? 0) + (Number(d.count) || 0) })
      }
    }
    return [...byValue.values()]
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([v, count]) => ({
      value: v,
      count: Number(count) || 0,
    }))
  }
  return undefined
}

const sumN = (a?: number | null, b?: number | null): number | undefined =>
  a == null && b == null ? undefined : (a ?? 0) + (b ?? 0)
const lowest = <T>(a?: T | null, b?: T | null): T | undefined =>
  a == null ? b ?? undefined : b == null ? a : a < b ? a : b
const highest = <T>(a?: T | null, b?: T | null): T | undefined =>
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
    primaryCount: a.primaryCount ?? b.primaryCount,
    secondaryCount: a.secondaryCount ?? b.secondaryCount,
  }
}

// Normalize a raw fieldStats response (apply in transformResponse).
export const normalizeFieldStats = (stats: FieldStats[]): FieldStats[] =>
  stats.map((s) => ({
    ...s,
    columnName: canonicalColumnId(s.columnName),
    distribution: normalizeDistribution(s.distribution),
  }))

// Merge stats lists by canonical column id, field-wise: overlay's non-null values
// win, base fills the gaps. A single list also dedupes its own repeated columns.
export const mergeFieldStats = (
  overlay: FieldStats[] = [],
  base: FieldStats[] = [],
): FieldStats[] => {
  const byId = new Map<string, FieldStats>()
  for (const s of base) byId.set(canonicalColumnId(s.columnName), { ...s })
  for (const s of overlay) {
    const id = canonicalColumnId(s.columnName)
    const merged: FieldStats = { ...(byId.get(id) || { columnName: s.columnName }) }
    for (const [k, v] of Object.entries(s)) {
      if (v !== null && v !== undefined) (merged as any)[k] = v
    }
    byId.set(id, merged)
  }
  return [...byId.values()]
}

// Total row count for an entity set = max(filled + not-filled) across its
// stat columns. Feeds the main folders/tasks count cell.
export const totalRowsFromStats = (stats: FieldStats[]): number =>
  stats.reduce(
    (max, s) => Math.max(max, (s.valueFilledCount ?? 0) + (s.valueNotFilledCount ?? 0)),
    0,
  )

// Combine primary-entity stats (tasks/versions) with group-entity stats
// (folders/products) for the "include groups & folders" row scope.
export const combineFieldStats = (
  primary: FieldStats[],
  group: FieldStats[] = [],
): FieldStats[] => {
  const byId = new Map<string, FieldStats>()
  for (const s of primary) byId.set(canonicalColumnId(s.columnName), s)
  const out = new Map(byId)
  for (const g of group) {
    const id = canonicalColumnId(g.columnName)
    const p = byId.get(id)
    out.set(id, p ? combineTwo(p, g) : g)
  }
  return [...out.values()]
}
