import { useEffect, useMemo, useRef } from 'react'
import {
  useGetTaskColumnStatsQuery,
  useGetVersionsColumnStatsQuery,
  groupByToStatsTarget,
  selectGroupCounts,
} from '@shared/api'
import type { FieldStats, GroupCountsMap } from '@shared/api'
import type { TableGroupBy } from '../context'
import { UNGROUPED_VALUE } from './useBuildGroupByTableData'

type TaskStatsArgs = {
  projectName: string
  filter?: string
  folderFilter?: string
  search?: string
  folderIds?: string[]
  taskIds?: string[]
}

type VersionStatsArgs = {
  projectName: string
  versionFilter?: string
  productFilter?: string
  taskFilter?: string
  folderIds?: string[]
  versionIds?: string[]
  productIds?: string[]
}

export type UseGroupCountsParams =
  | { entity: 'task'; groupBy?: TableGroupBy; args: TaskStatsArgs; skip?: boolean }
  | { entity: 'version'; groupBy?: TableGroupBy; args: VersionStatsArgs; skip?: boolean }

export type GroupCountsResult = {
  counts: GroupCountsMap | undefined
  total: number
  isLoading: boolean
  isSupported: boolean
}

const EMPTY: FieldStats[] = []

// Filter-aware per-group counts for the active grouping. Requests a single
// Distribution target for the grouped field via the column-stats query, so for
// licensed users it shares the footer's cache entry (targets are stripped from
// the cache key) — no duplicate fetch. Not gated by the PowerPack license.
export const useGroupCounts = (params: UseGroupCountsParams): GroupCountsResult => {
  const { entity, groupBy, skip } = params

  const target = useMemo(
    () => (groupBy ? groupByToStatsTarget(groupBy, entity) : null),
    [groupBy, entity],
  )
  const targets = useMemo(() => (target ? [target] : undefined), [target])
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
    // Return as soon as any bucket is known. The Ungrouped (notFilled) count is
    // available before the named distribution, and must not be gated behind it —
    // otherwise it stays blank on first load until the distribution arrives.
    return {
      counts: hasData && selection.counts.size > 0 ? selection.counts : undefined,
      total: selection.total,
      complete: selection.complete,
    }
  }, [fieldStats, target, hasData])

  // Self-heal a dedupe race: this query shares its cache entry with the footer
  // stats (`targets` is stripped from the key). When both mount in the same
  // tick, the second subscriber joins the first's in-flight request and its own
  // target is never fetched. If the settled data lacks our field's stats, force
  // one refetch (which runs with our targets and merges into the shared cache).
  const retriedRef = useRef<string | null>(null)
  useEffect(() => {
    if (disabled || !target || !hasData || active.isFetching || complete) return
    if (retriedRef.current === target.field) return
    retriedRef.current = target.field
    console.log('[useGroupCounts] stats missing for', target.field, '— refetching')
    active.refetch()
  }, [disabled, target, hasData, active.isFetching, complete, active.refetch])

  return {
    counts,
    total,
    isLoading: !disabled && (active.isLoading || active.isFetching),
    isSupported: !!target,
  }
}
