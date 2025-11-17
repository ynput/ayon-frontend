import { useMemo } from 'react'
import { ProjectTableAttribute } from '../types'
import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { getAttributeIcon } from '@shared/util'

// @martastain says list_of_* is a pita to implement, so we are not supporting it for now
export const allowedGroupByFields = ['string', 'integer', 'float']
export const isAttribGroupable = (
  attrib: ProjectTableAttribute,
  entityType?: string,
  allowedTypes?: ('string' | 'integer' | 'float')[],
  enumOnly?: boolean,
) => {
  const typesToCheck = allowedTypes || allowedGroupByFields
  const hasValidType =
    typesToCheck.includes(attrib.data.type) &&
    (!entityType || attrib.scope?.includes(entityType as (typeof attrib.scope)[0]))

  if (!hasValidType) return false
  if (enumOnly) return !!attrib.data.enum && attrib.data.enum.length > 0

  return true
}

export const useGetGroupedFields = ({
  allowedTypes,
  enumOnly,
  scope,
}: {
  allowedTypes?: ('string' | 'integer' | 'float')[]
  enumOnly?: boolean
  scope?: string
}) => {
  const { columnOrder } = useColumnSettingsContext()
  const { attribFields } = useProjectTableContext()

  return useMemo(
    () =>
      [
        {
          value: 'taskType',
          label: 'Task type',
          icon: getAttributeIcon('task'),
          scopes: ['task', 'version'],
        },
        {
          value: 'productType',
          label: 'Product type',
          icon: getAttributeIcon('product'),
          scopes: ['product', 'version'],
        },
        // {
        //   value: 'version',
        //   label: 'Version',
        //   icon: getAttributeIcon('version'),
        //   scopes: ['version'],
        // },
        // {
        //   value: 'author',
        //   label: 'Author',
        //   icon: getAttributeIcon('author'),
        //   scopes: ['version'],
        // },
        {
          value: 'assignees',
          label: 'Assignee',
          icon: getAttributeIcon('assignees'),
          scopes: ['task'],
        },
        {
          value: 'status',
          label: 'Status',
          icon: getAttributeIcon('status'),
          scopes: ['task', 'version', 'folder', 'product'],
        },
        {
          value: 'tags',
          label: 'Tags',
          icon: getAttributeIcon('tags'),
          scopes: ['task', 'version', 'folder', 'product'],
        },
        ...attribFields
          .filter((attrib) => isAttribGroupable(attrib, scope, allowedTypes, enumOnly))
          .map((field) => ({
            value: 'attrib.' + field.name,
            label: field.data.title || field.name,
            icon: getAttributeIcon(field.name),
          })),
      ]
        .filter((field) => !scope || ('scopes' in field ? field.scopes.includes(scope) : true))
        .sort((a, b) => {
          const indexA = columnOrder.indexOf(a.value)
          const indexB = columnOrder.indexOf(b.value)
          if (indexA === -1 && indexB === -1) return 0
          if (indexA === -1) return 1
          if (indexB === -1) return -1
          return indexA - indexB
        }),
    [attribFields, columnOrder, allowedTypes, enumOnly, scope],
  )
}
