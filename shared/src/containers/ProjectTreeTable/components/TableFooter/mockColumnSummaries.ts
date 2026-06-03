import { BuiltInFieldOptions, ProjectTableAttribute } from '../../types'
import { classifyColumnSummary } from './classifyColumnSummary'
import { getColumnEnumItems } from './getColumnEnumItems'
import { ColumnSummary, ColumnSummaryMap, SummaryDistributionItem } from './summaryTypes'

// Stable pseudo-random in [0,1) seeded by a string — keeps mock numbers from
// flickering between renders while the real backend aggregation is built.
const seeded = (seed: string): number => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

const splitCounts = (total: number, n: number, seed: string): number[] => {
  if (n <= 0) return []
  const weights = Array.from({ length: n }, (_, i) => seeded(seed + i) + 0.1)
  const sum = weights.reduce((a, w) => a + w, 0)
  const counts = weights.map((w) => Math.floor((w / sum) * total))
  let remainder = total - counts.reduce((a, c) => a + c, 0)
  for (let i = 0; remainder > 0; i = (i + 1) % n, remainder--) counts[i]++
  return counts
}

type MockArgs = {
  columnIds: string[]
  attribs: ProjectTableAttribute[]
  options: BuiltInFieldOptions
  total: number
}

export const mockColumnSummaries = ({
  columnIds,
  attribs,
  options,
  total,
}: MockArgs): ColumnSummaryMap => {
  const map: ColumnSummaryMap = {}

  for (const columnId of columnIds) {
    const kind = classifyColumnSummary(columnId, attribs)
    const summary: ColumnSummary = { columnId, total }

    switch (kind) {
      case 'number': {
        const min = Math.round(seeded(columnId + 'min') * 10)
        const max = min + Math.round(seeded(columnId + 'max') * 90) + 1
        const avg = Math.round(((min + max) / 2) * 100) / 100
        summary.min = min
        summary.max = max
        summary.avg = avg
        summary.sum = avg * total
        break
      }
      case 'boolean': {
        const checked = Math.round(seeded(columnId) * total)
        summary.checkedCount = checked
        summary.notCheckedCount = total - checked
        summary.percentageChecked = total ? Math.round((checked / total) * 1000) / 10 : 0
        summary.percentageNotChecked = total ? Math.round(((total - checked) / total) * 1000) / 10 : 0
        break
      }
      case 'text': {
        const filled = Math.round(seeded(columnId) * total)
        summary.filledCount = filled
        summary.notFilledCount = total - filled
        summary.percentageFilled = total ? Math.round((filled / total) * 1000) / 10 : 0
        summary.percentageNotFilled = total ? Math.round(((total - filled) / total) * 1000) / 10 : 0
        break
      }
      case 'datetime': {
        summary.minDate = '2026-01-12T09:30:00Z'
        summary.maxDate = '2026-06-02T17:45:00Z'
        break
      }
      case 'enum': {
        const items = getColumnEnumItems(columnId, attribs, options)
        if (items.length) {
          const counts = splitCounts(total, items.length, columnId)
          summary.distribution = items.map<SummaryDistributionItem>((item, i) => ({
            value: String(item.value),
            label: item.label,
            color: item.color,
            icon: item.icon,
            count: counts[i],
          }))
        }
        break
      }
      case 'assignee': {
        const users = options.assignee || []
        if (users.length) {
          const counts = splitCounts(total, users.length, columnId)
          summary.distribution = users.map<SummaryDistributionItem>((u, i) => ({
            value: String(u.value),
            label: u.label,
            fullName: u.label,
            count: counts[i],
          }))
        }
        break
      }
      default:
        break
    }

    map[columnId] = summary
  }

  return map
}
