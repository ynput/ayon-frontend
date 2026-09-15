import { useEffect, useMemo, useRef } from 'react'
import {
  useGetTaskColumnStatsQuery,
  useGetVersionsColumnStatsQuery,
  groupByToStatsTarget,
  selectGroupCounts,
  targetToColumnId,
} from '@shared/api'
import type { FieldStats, GroupCountsMap, MetricTarget } from '@shared/api'
import type { TableGroupBy } from '../context'
import { UNGROUPED_VALUE } from './useBuildGroupByTableData'

export type TaskStatsArgs = {
  projectName: string
  filter?: string
  folderFilter?: string
  search?: string
  folderIds?: string[]
  taskIds?: string[]
}

export type VersionStatsArgs = {
  projectName: string
  versionFilter?: string
  productFilter?: string
  taskFilter?: string
  folderFilter?: string
  folderIds?: string[]
  versionIds?: string[]
  productIds?: string[]
  latestPerFolder?: boolean
}

export type UseGroupCountsParams =
  | {
      entity: 'task'
      groupBy?: TableGroupBy
      // extra groupings whose targets ride along in the same request (e.g. sibling slicer panels)
      extraGroupBys?: TableGroupBy[]
      args: TaskStatsArgs
      skip?: boolean
    }
  | {
      entity: 'version'
      groupBy?: TableGroupBy
      extraGroupBys?: TableGroupBy[]
      args: VersionStatsArgs
      skip?: boolean
    }

export type GroupCountsResult = {
  counts: GroupCountsMap | undefined
  // true once named-group stats have loaded
  complete: boolean
  total: number
  isLoading: boolean
  isSupported: boolean
}

const EMPTY: FieldStats[] = []
const MAX_HEAL_ATTEMPTS = 3

// Filter-aware per-group counts for the active grouping. Requests a single
// Distribution target for the grouped field via the column-stats query, so for
// licensed users it shares the footer's cache entry (targets are stripped from
// the cache key) — no duplicate fetch. Not gated by the PowerPack license.
export const useGroupCounts = (params: UseGroupCountsParams): GroupCountsResult => {
  const { entity, groupBy, extraGroupBys, skip } = params

  const target = useMemo(
    () => (groupBy ? groupByToStatsTarget(groupBy, entity) : null),
    [groupBy, entity],
  )
  const targets = useMemo(() => {
    if (!target) return undefined
    const fields = new Set([target.field])
    const extras: MetricTarget[] = []
    for (const extra of extraGroupBys ?? []) {
      const extraTarget = groupByToStatsTarget(extra, entity)
      if (extraTarget && !fields.has(extraTarget.field)) {
        fields.add(extraTarget.field)
        extras.push(extraTarget)
      }
    }
    return [target, ...extras]
  }, [target, extraGroupBys, entity])
  const disabled = !!skip || !target

  const projectName = params.args.projectName

  const taskRes = useGetTaskColumnStatsQuery(
    { ...(params.entity === 'task' ? params.args : { projectName }), targets },
    { skip: disabled || params.entity !== 'task' },
  )
  const versionRes = useGetVersionsColumnStatsQuery(
    { ...(params.entity === 'version' ? params.args : { projectName }), targets },
    { skip: disabled || params.entity !== 'version' },
  )

  const active = params.entity === 'task' ? taskRes : versionRes
  const fieldStats = active.data ?? EMPTY
  const hasData = !!active.data

  const { counts, total, complete } = useMemo(() => {
    const selection = selectGroupCounts(fieldStats, target)
    if (selection.ungrouped.count > 0) {
      selection.counts.set(UNGROUPED_VALUE, selection.ungrouped)
    }
    // Ungrouped (notFilled) resolves before the named distribution — emit it as soon as known.
    return {
      counts: hasData && selection.counts.size > 0 ? selection.counts : undefined,
      total: selection.total,
      complete: selection.complete,
    }
  }, [fieldStats, target, hasData])

  // Self-heal: the shared cache entry (targets stripped from the key) can settle
  // without our field's stats when we joined another subscriber's in-flight fetch.
  const healAttemptsRef = useRef(new Map<string, number>())
  const noStatsFieldsRef = useRef(new Set<string>())
  const argsKey = useMemo(() => JSON.stringify(params.args), [params.args])
  useEffect(() => {
    // new args = new cache entry, where the race can recur — allow healing again
    healAttemptsRef.current.clear()
    noStatsFieldsRef.current.clear()
  }, [argsKey])
  useEffect(() => {
    if (disabled || !target || !hasData || active.isFetching || complete) return
    const field = target.field
    if (noStatsFieldsRef.current.has(field)) return
    if (fieldStats.some((s) => s.columnName === targetToColumnId(field))) {
      // a fetch carried our field and returned no distribution — nothing left to heal
      noStatsFieldsRef.current.add(field)
      return
    }
    // no stat row = our targets never reached the server (RTK swallows a refetch
    // dispatched while the shared entry is still pending) — retry, bounded
    const attempts = healAttemptsRef.current.get(field) ?? 0
    if (attempts >= MAX_HEAL_ATTEMPTS) return
    healAttemptsRef.current.set(field, attempts + 1)
    active.refetch()
  }, [disabled, target, hasData, active.isFetching, complete, fieldStats, active.refetch])

  return {
    counts,
    complete,
    total,
    isLoading: !disabled && (active.isLoading || active.isFetching),
    isSupported: !!target,
  }
}
