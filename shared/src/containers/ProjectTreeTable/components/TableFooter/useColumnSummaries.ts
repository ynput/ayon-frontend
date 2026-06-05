import { useMemo } from 'react'
import { combineFieldStats } from '@shared/api'
import type { FieldStats } from '@shared/api'
import { mapColumnStatsToSummary } from './mapColumnStats'
import { ColumnSummaryMap } from './summaryTypes'

type Args = {
  enabled: boolean
  fieldStats?: FieldStats[]
  groupFieldStats?: FieldStats[]
}

export type ColumnSummariesResult = {
  summaries: ColumnSummaryMap
  allScopeSummaries: ColumnSummaryMap
  groupScopeSummaries: ColumnSummaryMap
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
    const groupScopeSummaries = groupFieldStats?.length
      ? mapColumnStatsToSummary(groupFieldStats)
      : {}
    return { summaries, allScopeSummaries, groupScopeSummaries }
  }, [enabled, fieldStats, groupFieldStats])
}
