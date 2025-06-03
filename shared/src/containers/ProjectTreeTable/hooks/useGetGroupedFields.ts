import { useMemo } from 'react'
import {
  ProjectTableAttribute,
  useColumnSettingsContext,
  useProjectTableContext,
} from '@shared/containers'
import { getAttributeIcon } from '@shared/util'
import { EntityGrouping } from '@shared/api'

// @martastain says list_of_* is a pita to implement, so we are not supporting it for now
export const allowedGroupByFields = ['string', 'integer', 'float']
export const isAttribGroupable = (
  attrib: ProjectTableAttribute,
  entityType: EntityGrouping['entityType'],
  allowedTypes?: ('string' | 'integer' | 'float')[],
  enumOnly?: boolean,
) => {
  const typesToCheck = allowedTypes || allowedGroupByFields
  const hasValidType = typesToCheck.includes(attrib.data.type) && attrib.scope?.includes(entityType)

  if (!hasValidType) return false
  if (enumOnly) return !!attrib.data.enum && attrib.data.enum.length > 0

  return true
}

export const useGetGroupedFields = (
  allowedTypes?: ('string' | 'integer' | 'float')[],
  enumOnly?: boolean,
) => {
  const { columnOrder } = useColumnSettingsContext()
  const { attribFields } = useProjectTableContext()

  return useMemo(
    () =>
      [
        {
          value: 'taskType',
          label: 'Task Type',
          icon: getAttributeIcon('task'),
        },
        {
          value: 'assignees',
          label: 'Assignees',
          icon: getAttributeIcon('assignees'),
        },
        {
          value: 'status',
          label: 'Status',
          icon: getAttributeIcon('status'),
        },
        {
          value: 'tags',
          label: 'Tags',
          icon: getAttributeIcon('tags'),
        },
        ...attribFields
          .filter((attrib) => isAttribGroupable(attrib, 'task', allowedTypes, enumOnly))
          .map((field) => ({
            value: 'attrib.' + field.name,
            label: field.data.title || field.name,
            icon: getAttributeIcon(field.name),
          })),
      ].sort((a, b) => {
        const indexA = columnOrder.indexOf(a.value)
        const indexB = columnOrder.indexOf(b.value)
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      }),
    [attribFields, columnOrder, allowedTypes, enumOnly],
  )
}
