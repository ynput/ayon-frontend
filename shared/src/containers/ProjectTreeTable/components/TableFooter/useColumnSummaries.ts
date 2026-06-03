import { useMemo } from 'react'
import { mapColumnStatsToSummary, FieldStats } from './mapColumnStats'
import { ColumnSummaryMap } from './summaryTypes'

type Args = {
  enabled: boolean
  // Backend column stats (connection.fieldStats). Every footer value — including
  // the main count — comes from here; the footer does no client-side aggregation.
  fieldStats?: FieldStats[]
}

export type ColumnSummariesResult = {
  summaries: ColumnSummaryMap
} | null

export const useColumnSummaries = ({ enabled, fieldStats }: Args): ColumnSummariesResult => {
  return useMemo(() => {
    if (!enabled) return null
    const summaries = fieldStats ? mapColumnStatsToSummary(fieldStats) : {}
    return { summaries }
  }, [enabled, fieldStats])
}
