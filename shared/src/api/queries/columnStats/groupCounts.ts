// Pure helpers for per-group counts on grouped table rows. Reuse the existing
// filter-aware column-stats distribution; no new endpoint. Kept free of query
// hooks so it stays unit-testable and outside the api<->container import edge.
import { StatsOperation } from '@shared/api/generated'
import { canonicalColumnId, type FieldStats } from './columnStats'
import type { MetricTarget, StatsEntity } from './metricTargets'

export type GroupCount = { count: number; percentage: number }
export type GroupCountsMap = Map<string, GroupCount>
export type GroupCountsSelection = {
  counts: GroupCountsMap
  total: number
  // the null/empty bucket (no value for the grouped field) -> Ungrouped row
  ungrouped: GroupCount
}

// Distribution buckets the values; NotFilled gives the null/empty (Ungrouped)
// count so the denominator covers every item, not just the ones with a value.
const DISTRIBUTION_AGGS = [StatsOperation.Distribution, StatsOperation.NotFilled]

// groupBy.id -> backend stats field, per entity. Only the field-value groupings
// the distribution endpoint covers; folder/folderType/hierarchy return null.
const TASK_FIELDS: Record<string, string> = {
  status: 'status',
  assignees: 'assignees',
  tags: 'tags',
  taskType: 'task_type',
}
const VERSION_FIELDS: Record<string, string> = {
  status: 'status',
  tags: 'tags',
  productType: 'product_type',
}

export const groupByToStatsTarget = (
  groupBy: { id: string },
  entity: StatsEntity,
): MetricTarget | null => {
  const fields = entity === 'version' || entity === 'product' ? VERSION_FIELDS : TASK_FIELDS
  const field = fields[groupBy.id]
  if (field) return { field, aggregations: DISTRIBUTION_AGGS }

  if (groupBy.id.startsWith('attrib.')) {
    const name = groupBy.id.slice('attrib.'.length)
    // tasks/folders display inherited attrib values; versions/products use own
    const attribField =
      entity === 'task' || entity === 'folder'
        ? `inherited_attributes.${name}`
        : `attrib.${name}`
    return { field: attribField, aggregations: DISTRIBUTION_AGGS }
  }

  return null
}

// Per-group count + percentage of the filtered total, read from the grouped
// field's distribution. Denominator = all items (value buckets + not-filled).
// Ungrouped count = not-filled; its percentage is the remainder so the column
// sums to 100% (absorbs per-group rounding drift).
export const selectGroupCounts = (
  fieldStats: FieldStats[],
  target: MetricTarget | null,
): GroupCountsSelection => {
  const counts: GroupCountsMap = new Map()
  const none: GroupCount = { count: 0, percentage: 0 }
  if (!target) return { counts, total: 0, ungrouped: none }

  const columnId = canonicalColumnId(target.field)
  const stat = fieldStats.find((s) => s.columnName === columnId)
  const distribution = stat?.distribution ?? []
  const notFilled = stat?.valueNotFilledCount ?? 0

  const distSum = distribution.reduce((sum, d) => sum + (d.count || 0), 0)
  const total = distSum + notFilled

  let pctSum = 0
  for (const d of distribution) {
    const count = d.count || 0
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    pctSum += percentage
    counts.set(String(d.value), { count, percentage })
  }

  const ungrouped: GroupCount = {
    count: notFilled,
    percentage: notFilled > 0 && total > 0 ? Math.max(0, 100 - pctSum) : 0,
  }
  return { counts, total, ungrouped }
}
