import { useMemo } from 'react'
import type { TableRow } from '../../types/table'
import { BuiltInFieldOptions, ProjectTableAttribute } from '../../types'
import { mockColumnSummaries } from './mockColumnSummaries'
import { mapColumnStatsToSummary, BackendColumnStats } from './mapColumnStats'
import { ColumnSummaryMap, MainCountSummary } from './summaryTypes'

type Args = {
  enabled: boolean
  columnIds: string[]
  attribs: ProjectTableAttribute[]
  options: BuiltInFieldOptions
  tableData: TableRow[]
  scopes: string[]
  isGrouping: boolean
  showHierarchy: boolean
  // Real backend stats (connection.fieldStats). When provided, used directly;
  // otherwise the footer renders mock data. This is the single switch from
  // mock -> real once the backend aggregation lands.
  fieldStats?: BackendColumnStats[]
}

export type ColumnSummariesResult = {
  summaries: ColumnSummaryMap
  mainCount: MainCountSummary
} | null

const countRows = (rows: TableRow[]) => {
  let groups = 0
  let leaves = 0
  const walk = (list: TableRow[]) => {
    for (const r of list) {
      if (r.entityType === 'folder' || r.entityType === 'group') groups++
      else leaves++
      if (r.subRows?.length) walk(r.subRows)
    }
  }
  walk(rows)
  return { groups, leaves }
}

export const useColumnSummaries = ({
  enabled,
  columnIds,
  attribs,
  options,
  tableData,
  scopes,
  isGrouping,
  showHierarchy,
  fieldStats,
}: Args): ColumnSummariesResult => {
  return useMemo(() => {
    if (!enabled) return null

    const { groups, leaves } = countRows(tableData)
    const isAttributeGroup = isGrouping && !showHierarchy
    const isVersions = scopes.includes('version')

    const mainCount: MainCountSummary = {
      groups,
      tasks: leaves,
      groupLabel: isAttributeGroup ? 'groups' : isVersions ? 'products' : 'folders',
      taskLabel: isVersions ? 'versions' : 'tasks',
    }

    const summaries = fieldStats
      ? mapColumnStatsToSummary(fieldStats)
      : mockColumnSummaries({ columnIds, attribs, options, total: leaves || 1 })

    return { summaries, mainCount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    columnIds.join(','),
    attribs,
    options,
    tableData,
    scopes,
    isGrouping,
    showHierarchy,
    fieldStats,
  ])
}
