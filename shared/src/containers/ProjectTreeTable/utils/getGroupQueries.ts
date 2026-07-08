import type { EntityGroup } from '@shared/api'
import type { QueryCondition, QueryFilter } from '../types/operations'
import type { TableGroupBy } from '../context'
import { UNGROUPED_VALUE } from '../hooks/useBuildGroupByTableData'

export type GetGroupQueriesParams = {
  groups: EntityGroup[]
  filters?: QueryFilter
  groupBy: TableGroupBy
  groupPageCounts: Record<string, number>
  dataType?: string
}

export type GroupQuery = { value: string; count: number; filter: string }

// Tasks fetched across all groups, clamped per group.
const TOTAL_GROUP_COUNT = 1000
const MAX_PER_GROUP = 400
const MIN_PER_GROUP = 100

export const getCountPerGroup = (groupCount = 1): number =>
  Math.max(MIN_PER_GROUP, Math.min(MAX_PER_GROUP, Math.round(TOTAL_GROUP_COUNT / groupCount)))

// one filter per group value + an "Ungrouped" bucket for entities with no value
export const getGroupQueries = ({
  groups = [],
  filters = { conditions: [] },
  groupBy,
  groupPageCounts,
  dataType,
}: GetGroupQueriesParams): GroupQuery[] => {
  if (!groups.length) return []

  // list_of_* fields hold arrays -> membership operators instead of equality
  const list = !!dataType?.startsWith('list_of_')
  const base = filters.conditions || []

  const named: GroupQuery[] = groups.map((group) => {
    const condition: QueryCondition = {
      key: groupBy.id,
      value: [group.value],
      operator: list ? 'includesany' : 'in',
    }
    const pageCount = groupPageCounts[group.value] || 1
    return {
      value: group.value,
      count: getCountPerGroup(groups.length) * pageCount,
      filter: JSON.stringify({ ...filters, conditions: [...base, condition] }),
    }
  })

  const ungroupedCondition: QueryCondition = {
    key: groupBy.id,
    value: groups.map((g) => g.value),
    operator: list ? 'excludesany' : 'notin',
  }
  const ungrouped: GroupQuery = {
    value: UNGROUPED_VALUE,
    count: getCountPerGroup() * (groupPageCounts[UNGROUPED_VALUE] || 1),
    filter: JSON.stringify({ ...filters, conditions: [...base, ungroupedCondition] }),
  }

  return [...named, ungrouped]
}
