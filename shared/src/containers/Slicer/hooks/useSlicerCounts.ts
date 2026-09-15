import { useMemo } from 'react'
import type { GroupCountsMap } from '@shared/api'
import {
  useGroupCounts,
  type UseGroupCountsParams,
  type TaskStatsArgs,
  type VersionStatsArgs,
} from '../../ProjectTreeTable/hooks/useGroupCounts'
import { UNGROUPED_VALUE } from '../../ProjectTreeTable/hooks/useBuildGroupByTableData'

export type SlicerCountsSource =
  | { entity: 'task'; args: TaskStatsArgs }
  | { entity: 'version'; args: VersionStatsArgs }

// per-panel args: each panel's source excludes its own filter but keeps the others'
export type GetSlicerCountsSource = (sliceType: string) => SlicerCountsSource | undefined

export type SlicerCounts = {
  counts: GroupCountsMap | undefined
  total: number
  filled: number
  complete: boolean
}

const EMPTY_COUNTS: GroupCountsMap = new Map()

export const useSlicerCounts = (
  source: SlicerCountsSource | undefined,
  sliceType: string,
  allSliceTypes?: string[],
  skip?: boolean,
): SlicerCounts => {
  const groupBy = useMemo(() => ({ id: sliceType, desc: false }), [sliceType])
  // sibling panels' fields ride along so one request serves every panel's badges
  const extraGroupBys = useMemo(
    () => (allSliceTypes ?? []).filter((t) => t !== sliceType).map((t) => ({ id: t, desc: false })),
    [allSliceTypes, sliceType],
  )
  const disabled = !!skip || !source

  const params: UseGroupCountsParams =
    source?.entity === 'version'
      ? { entity: 'version', groupBy, extraGroupBys, args: source.args, skip: disabled }
      : {
          entity: 'task',
          groupBy,
          extraGroupBys,
          args: (source?.args ?? { projectName: '' }) as TaskStatsArgs,
          skip: disabled,
        }

  const { counts, total, complete } = useGroupCounts(params)

  // "Some value" (hasValue row) = entities that carry any value for the field.
  const ungrouped = counts?.get(UNGROUPED_VALUE)?.count ?? 0
  const filled = Math.max(total - ungrouped, 0)

  // Stats settled with an empty distribution (filters match nothing) still must
  // zero-fill badges — hand decorateBadges an empty map instead of undefined.
  const resolvedCounts = counts ?? (complete ? EMPTY_COUNTS : undefined)

  return {
    counts: disabled ? undefined : resolvedCounts,
    total,
    filled,
    complete: !disabled && complete,
  }
}

export default useSlicerCounts
