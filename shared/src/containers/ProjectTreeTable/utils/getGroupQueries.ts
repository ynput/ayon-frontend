import type { EntityGroup } from '@shared/api'
import type { QueryCondition, QueryFilter } from '@shared/containers'
import type { TableGroupBy } from '../context'
import { UNGROUPED_VALUE } from '@shared/containers'

export type GetGroupQueriesParams = {
  groups: EntityGroup[]
  filters?: QueryFilter
  groupBy: TableGroupBy
  groupPageCounts: Record<string, number>
  dataType?: string
  taskGroups?: EntityGroup[] // deprecated alias for `groups`, kept for back-compat
}

export type GroupQuery = { value: string; count: number; filter: string }

// Tasks fetched across all groups, clamped per group.
const TOTAL_GROUP_COUNT = 1000
const MAX_PER_GROUP = 400
const MIN_PER_GROUP = 100

export const getCountPerGroup = (groupCount = 1): number =>
  Math.max(MIN_PER_GROUP, Math.min(MAX_PER_GROUP, Math.round(TOTAL_GROUP_COUNT / groupCount)))

// tags/assignees/list_of_* hold arrays -> membership uses includes/excludes.
const isListField = (groupBy: TableGroupBy, dataType?: string): boolean =>
  !!dataType?.startsWith('list_of_') ||
  groupBy.id.includes('tags') ||
  groupBy.id.includes('assignees')

// One GetGroupedTasksList filter per group value, plus an "Ungrouped" bucket for
// entities with no value. Every query carries the active `filters` so counts and
// rows stay filter-aware. Pure + community — no powerpack dependency.
export const getGroupQueries = ({
  groups: groupsNew = [],
  taskGroups = [],
  filters = { conditions: [] },
  groupBy,
  groupPageCounts,
  dataType,
}: GetGroupQueriesParams): GroupQuery[] => {
  const groups = groupsNew.length ? groupsNew : taskGroups
  if (!groups.length) return []

  const list = isListField(groupBy, dataType)
  const base = filters.conditions || []

  // named groups: base filter AND field matches this value
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

  // ungrouped: base filter AND field is none of the group values
  const ungroupedCondition: QueryCondition = {
    key: groupBy.id,
    value: groups.map((g) => g.value),
    operator: list ? 'excludesany' : 'notin',
  }
  const ungrouped: GroupQuery = {
    value: UNGROUPED_VALUE,
    count: getCountPerGroup(),
    filter: JSON.stringify({ ...filters, conditions: [...base, ungroupedCondition] }),
  }

  return [...named, ungrouped]
}
