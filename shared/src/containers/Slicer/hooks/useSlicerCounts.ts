import { useMemo } from 'react'
import type { GroupCountsMap } from '@shared/api'
import { useSlicerContext } from '@shared/containers'
import {
  useGroupCounts,
  type UseGroupCountsParams,
  type TaskStatsArgs,
  type VersionStatsArgs,
} from '@shared/containers'
import { UNGROUPED_VALUE } from '@shared/containers'

export type SlicerCountsSource =
  | { entity: 'task'; args: TaskStatsArgs }
  | { entity: 'version'; args: VersionStatsArgs }

export type SlicerCounts = {
  counts: GroupCountsMap | undefined
  total: number
  filled: number
  complete: boolean
}

const EMPTY_COUNTS: GroupCountsMap = new Map()

export const useSlicerCounts = (
  source: SlicerCountsSource | undefined,
  skip?: boolean,
): SlicerCounts => {
  const { sliceType } = useSlicerContext()

  const groupBy = useMemo(() => ({ id: sliceType, desc: false }), [sliceType])
  const disabled = !!skip || !source

  const params: UseGroupCountsParams =
    source?.entity === 'version'
      ? { entity: 'version', groupBy, args: source.args, skip: disabled }
      : {
          entity: 'task',
          groupBy,
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
