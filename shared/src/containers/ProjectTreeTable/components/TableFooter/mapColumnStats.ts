import { canonicalColumnId } from '@shared/api'
import type { FieldStats } from '@shared/api'
import { ColumnSummary, ColumnSummaryMap, SummaryDistributionItem } from './summaryTypes'

export type { FieldStats }

const nn = <T>(v: T | null | undefined): T | undefined => (v == null ? undefined : v)

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
    const columnId = canonicalColumnId(s.columnName)
    const summary: ColumnSummary = {
      columnId,
      // datetime columns aren't summarized — only numeric min/max apply
      min: typeof s.min === 'number' ? s.min : undefined,
      max: typeof s.max === 'number' ? s.max : undefined,
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
      primaryCount: nn(s.primaryCount),
      secondaryCount: nn(s.secondaryCount),
    }
    summary.total = deriveTotal(summary)
    map[columnId] = summary
  }
  return map
}
