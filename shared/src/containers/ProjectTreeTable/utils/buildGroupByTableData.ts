// based on the groupBy field we take a flat list of items and group them
// each group is a root node with subItems as the grouped items
// any leftover items that do not match the groupBy field are added as a separate group ("Ungrouped")

import { ProjectModel, TaskGroup } from '@shared/api'
import { TableGroupBy, TableUser } from '../context'
import { EntitiesMap, ProjectTableAttribute, TableRow } from '../types'
export type GroupByEntityType = 'task' | 'folder' | 'version' | 'product'

export type GroupData = {
  value: string
  label: string
  color?: string
  icon?: string
  img?: string
}

const valueToStringArray = (value?: any) =>
  Array.isArray(value) ? value.map((v) => v.toString()) : [value.toString()]

// get group label, color and icon
const getGroupData = (groupById: string, groupValue: string, groups?: TaskGroup[]): GroupData => {
  if (!groups)
    return {
      value: groupValue,
      label: groupValue,
    }

  const group = groups.find((g) => g.value === groupValue)
  if (!group) {
    return {
      value: groupValue,
      label: groupValue,
    }
  } else {
    return {
      value: group.value,
      label: group.label || group.value,
      color: group.color,
      icon: group.icon,
      img: groupById === 'assignees' ? `/api/users/${group.value}/avatar` : undefined,
    }
  }
}

export const buildGroupByTableData = (
  entities: EntitiesMap,
  groupBy: TableGroupBy,
  entityType?: GroupByEntityType,
  groups: TaskGroup[] = [],
): TableRow[] => {
  const groupsMap = new Map<string, TableRow>()

  for (const group of groups) {
    const groupValue = group.value
    const groupData = getGroupData(groupBy.id, groupValue, groups)
    groupsMap.set(groupValue, {
      id: groupValue,
      name: groupValue,
      entityType: 'group',
      subRows: [],
      label: groupData.label,
      group: groupData,
    })
  }

  for (const [id, entity] of entities) {
    // add tasks to specific group
  }

  return Array.from(groupsMap.values())
}
