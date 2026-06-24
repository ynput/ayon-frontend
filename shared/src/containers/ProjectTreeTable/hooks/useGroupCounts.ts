import { useMemo } from 'react'
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
  counts: GroupCountsMap
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

  const { counts, total } = useMemo(() => {
    const selection = selectGroupCounts(fieldStats, target)
    if (selection.ungrouped.count > 0) {
      selection.counts.set(UNGROUPED_VALUE, selection.ungrouped)
    }
    return selection
  }, [fieldStats, target])

  return {
    counts,
    total,
    isLoading: !disabled && (active.isLoading || active.isFetching),
    isSupported: !!target,
  }
}
