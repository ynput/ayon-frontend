// based on the groupBy field we take a flat list of items and group them
// each group is a root node with subItems as the grouped items
// any leftover items that do not match the groupBy field are added as a separate group ("Ungrouped")

import { ProjectModel, TaskGroup } from '@shared/api'
import { TableGroupBy, TableUser } from '../context'
import { EditorTaskNode, EntitiesMap, EntityMap, ProjectTableAttribute, TableRow } from '../types'
import useGetEntityTypeData from './useGetEntityTypeData'
export type GroupByEntityType = 'task' | 'folder' | 'version' | 'product'

export type GroupData = {
  value: string
  label: string
  color?: string
  icon?: string
  img?: string
}

const valueToStringArray = (value?: any): string[] =>
  value ? (Array.isArray(value) ? value.map((v) => v.toString()) : [value.toString()]) : []

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

type BuildGroupByTableProps = {
  project?: ProjectModel
  entities: EntitiesMap
  entityType?: GroupByEntityType
  groups?: TaskGroup[]
}

const useBuildGroupByTableData = (props: BuildGroupByTableProps) => {
  const { project, entities, entityType, groups = [] } = props
  const getEntityTypeData = useGetEntityTypeData({ projectInfo: project })

  const entityToGroupRow = (task: EditorTaskNode): TableRow => {
    const typeData = getEntityTypeData('task', task.taskType)
    return {
      id: task.id,
      entityType: 'task',
      parentId: task.folderId,
      name: task.name || '',
      label: task.label || task.name || '',
      icon: typeData?.icon || null,
      color: typeData?.color || null,
      status: task.status,
      assignees: task.assignees,
      tags: task.tags,
      img: null,
      subRows: [],
      subType: task.taskType || null,
      attrib: task.attrib,
      ownAttrib: task.ownAttrib,
      path: task.folder.path,
      updatedAt: task.updatedAt,
    }
  }

  const buildGroupByTableData = (groupBy: TableGroupBy): TableRow[] => {
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

    const ungroupedId = '__ungrouped__'
    // gets the "Ungrouped" group, creating it if it doesn't exist
    const getUnGroupedGroup = () => {
      let ungroupedGroup = groupsMap.get(ungroupedId)
      if (!ungroupedGroup) {
        ungroupedGroup = {
          id: ungroupedId,
          name: 'Ungrouped',
          entityType: 'group',
          subRows: [],
          label: 'Ungrouped',
          group: { value: ungroupedId, label: 'Ungrouped' },
        }
        // create ungrouped group if it doesn't exist
        groupsMap.set(ungroupedId, ungroupedGroup)
      }
      return ungroupedGroup
    }

    for (const [id, entity] of entities) {
      // if the entity is not of the specified type, skip it
      if (entity.entityType !== entityType) continue
      // add entities to specific group
      let groupValues: string[] = []
      if (groupBy.id.startsWith('attrib_')) {
        // for attribute based grouping, get the value of the attribute
        const attributeId = groupBy.id.split('_')[1]
        groupValues = valueToStringArray(entity.attrib?.[attributeId])
      } else {
        groupValues = valueToStringArray(entity[groupBy.id as keyof EntityMap])
      }

      // if there are no values, add to "Ungrouped" group
      if (groupValues.length === 0) {
        const ungroupedGroup = getUnGroupedGroup()
        ungroupedGroup.subRows.push(entityToGroupRow(entity as EditorTaskNode))
      }
      // for each group value, find it's group and add the entity to it
      // if we can't find the group, add it to "Ungrouped"
      for (const groupValue of groupValues) {
        const groupRow = groupsMap.get(groupValue)
        if (groupRow) {
          groupRow.subRows.push(entityToGroupRow(entity as EditorTaskNode))
        } else {
          const ungroupedGroup = getUnGroupedGroup()
          ungroupedGroup.subRows.push(entityToGroupRow(entity as EditorTaskNode))
        }
      }
    }

    return Array.from(groupsMap.values())
  }

  return buildGroupByTableData
}

export default useBuildGroupByTableData
