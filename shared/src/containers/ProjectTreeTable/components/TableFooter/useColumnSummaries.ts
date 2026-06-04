import { useMemo } from 'react'
import { combineFieldStats, mapColumnStatsToSummary, FieldStats } from './mapColumnStats'
import { ColumnSummaryMap } from './summaryTypes'

type Args = {
  enabled: boolean
  fieldStats?: FieldStats[]
  groupFieldStats?: FieldStats[]
}

export type ColumnSummariesResult = {
  summaries: ColumnSummaryMap
  allScopeSummaries: ColumnSummaryMap
} | null

export const useColumnSummaries = ({
  enabled,
  fieldStats,
  groupFieldStats,
}: Args): ColumnSummariesResult => {
  return useMemo(() => {
    if (!enabled) return null
    const summaries = fieldStats ? mapColumnStatsToSummary(fieldStats) : {}
    const allScopeSummaries = groupFieldStats?.length
      ? mapColumnStatsToSummary(combineFieldStats(fieldStats ?? [], groupFieldStats))
      : summaries
    return { summaries, allScopeSummaries }
  }, [enabled, fieldStats, groupFieldStats])
}
