// based on the groupBy field we take a flat list of items and group them
// each group is a root node with subItems as the grouped items
// any leftover items that do not match the groupBy field are added as a separate group ("Ungrouped")

import { ProjectModel, EntityGroup } from '@shared/api'
import { TableGroupBy } from '../context'
import { EditorTaskNode, EntitiesMap, EntityMap, ProjectTableAttribute, TableRow } from '../types'
import useGetEntityTypeData from './useGetEntityTypeData'
import { useCallback } from 'react'
export type GroupByEntityType = 'task' | 'folder' | 'version' | 'product'

export type GroupData = {
  value: string
  label: string
  color?: string
  icon?: string
  img?: string
  count?: number
}

export const NEXT_PAGE_ID = 'next-page'
export const UNGROUPED_VALUE = '_ungrouped'
export const ROW_ID_SEPARATOR = '__'

const valueToStringArray = (value?: any): string[] =>
  value ? (Array.isArray(value) ? value.map((v) => v.toString()) : [value.toString()]) : []

// get group label, color and icon
const getGroupData = (groupById: string, groupValue: string, groups?: EntityGroup[]): GroupData => {
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
      count: group.count,
      img: groupById === 'assignees' ? `/api/users/${group.value}/avatar` : undefined,
    }
  }
}

export const GROUP_BY_ID = '_GROUP_'
export const buildGroupId = (value: string) => `${GROUP_BY_ID}${value}`
export const parseGroupId = (groupId: string): string | null => {
  if (!groupId.startsWith(GROUP_BY_ID)) return null
  return groupId.slice(GROUP_BY_ID.length) // +1 for the underscore
}
export const isGroupId = (id: string): boolean => id.startsWith(GROUP_BY_ID)

type BuildGroupByTableProps = {
  project?: ProjectModel
  entities: EntitiesMap
  entityType?: GroupByEntityType
  groups?: EntityGroup[]
  attribFields: ProjectTableAttribute[]
}

// get sorting ids based on the groupBy field
const getSortingIds = (
  groupBy: TableGroupBy,
  project?: ProjectModel,
  attribFields: ProjectTableAttribute[] = [],
): string[] => {
  const attributeId = groupBy.id.replace('attrib.', '')

  // for status, taskType, folderType use project data order
  if (attributeId === 'status') {
    return project?.statuses?.map((s) => s.name) || []
  } else if (attributeId === 'taskType') {
    return project?.taskTypes?.map((t) => t.name) || []
  } else if (attributeId === 'folderType') {
    return project?.folderTypes?.map((f) => f.name) || []
  } else if (groupBy.id.startsWith('attrib.')) {
    // for other enum attributes, use the enum values order
    return (
      attribFields
        .find((field) => field.name === attributeId)
        ?.data.enum?.map((e) => e.value.toString()) || []
    )
  } else return []
}

const useBuildGroupByTableData = (props: BuildGroupByTableProps) => {
  const { project, entities, entityType, groups = [], attribFields } = props
  const getEntityTypeData = useGetEntityTypeData({ projectInfo: project })

  const entityToGroupRow = useCallback(
    (task: EditorTaskNode, group?: string): TableRow => {
      const typeData = getEntityTypeData('task', task.taskType)
      return {
        id: task.id + ROW_ID_SEPARATOR + group, // unique id for the task in the folder
        entityId: task.id,
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
    },
    [getEntityTypeData],
  )

  const buildGroupByTableData = (groupBy: TableGroupBy): TableRow[] => {
    const groupsMap = new Map<string, TableRow>()

    for (const group of groups) {
      const groupValue = group.value?.toString() as string
      const groupId = buildGroupId(groupValue)
      const groupData = getGroupData(groupBy.id, groupValue, groups)
      groupsMap.set(groupValue, {
        id: groupId,
        name: groupValue,
        entityType: 'group',
        subRows: [],
        label: groupData.label,
        group: groupData,
      })
    }

    const ungroupedId = GROUP_BY_ID + '.' + UNGROUPED_VALUE // unique id for ungrouped group
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
      if (groupBy.id.startsWith('attrib.')) {
        // for attribute based grouping, get the value of the attribute
        const attributeId = groupBy.id.split('.')[1]
        groupValues = valueToStringArray(entity.attrib?.[attributeId])
      } else {
        groupValues = valueToStringArray(entity[groupBy.id as keyof EntityMap])
      }

      // if there are no values, add to "Ungrouped" group
      if (groupValues.length === 0) {
        const ungroupedGroup = getUnGroupedGroup()
        ungroupedGroup.subRows.push(entityToGroupRow(entity as EditorTaskNode, UNGROUPED_VALUE))
      }
      // for each group value, find it's group and add the entity to it
      // if we can't find the group, add it to "Ungrouped"
      for (const groupValue of groupValues) {
        const groupRow = groupsMap.get(groupValue)
        if (groupRow) {
          groupRow.subRows.push(entityToGroupRow(entity as EditorTaskNode, groupValue))
        } else {
          const ungroupedGroup = getUnGroupedGroup()
          ungroupedGroup.subRows.push(entityToGroupRow(entity as EditorTaskNode, UNGROUPED_VALUE))
        }
      }

      // for groups metadata on entity, check if there is a next page
      if ('groups' in entity && Array.isArray(entity.groups)) {
        for (const group of entity.groups) {
          const hasNextPageGroup = group.hasNextPage
          if (hasNextPageGroup && groupsMap.has(group.value)) {
            // add a next page row to the group
            const groupRow = groupsMap.get(group.value)
            if (groupRow) {
              groupRow.subRows.push({
                id: `${group.value}-next-page`,
                name: `Load more tasks...`,
                entityType: NEXT_PAGE_ID,
                subRows: [],
                label: `Next page for ${group.value}`,
                group: { value: group.value, label: group.value },
              })
            }
          }
        }
      }
    }

    const groupsList = Array.from(groupsMap.values())

    const attribSortingIds = getSortingIds(groupBy, project, attribFields)

    // sort the groups by their label
    // if the group is an attribute with enum values, sort by the enum values
    groupsList.sort((a, b) => {
      if (a.group?.value === ungroupedId) return 1 // "Ungrouped" should be last
      if (b.group?.value === ungroupedId) return -1 // "Ungrouped" should be last
      if (attribSortingIds.length) {
        // sort by index of the enum value
        const indexA = attribSortingIds.indexOf(a.group?.value || '')
        const indexB = attribSortingIds.indexOf(b.group?.value || '')
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB
        }
        if (indexA !== -1) return -1 // a is in the enum, b is not
        if (indexB !== -1) return 1 // b is in the enum, a is not
        // if both are not in the enum, sort by label
        return a.group?.label?.localeCompare(b.group?.label || '') || 0
      } else {
        // for other groupings, sort by the group label
        return a.group?.label?.localeCompare(b.group?.label || '') || 0
      }
    })

    return groupsList
  }

  return buildGroupByTableData
}

export default useBuildGroupByTableData
