import { useMemo } from 'react'
import { upperFirst } from 'lodash'
import { AttributeField } from '../../DetailsPanelAttributes/DetailsPanelAttributesEditor'
import type { EntityForm } from '../types'
import { readOnlyFields, attributeFields } from '../types'

interface UseEntityFieldsProps {
  attributes: any[]
  folderTypes: any[]
  taskTypes: any[]
  statuses: any[]
  tags: any[]
  entityType?: string
}

export const useEntityFields = ({
  attributes,
  folderTypes,
  taskTypes,
  statuses,
  tags,
  entityType,
}: UseEntityFieldsProps) => {
  const fields: AttributeField[] = useMemo(() => {
    const customFieldsData: AttributeField[] = [
      {
        name: 'name',
        data: {
          type: 'string',
          title: 'Name',
          description: 'The name of the entity, used for identification in the pipeline',
        },
      },
      {
        name: 'label',
        data: {
          type: 'string',
          title: 'Label',
          description: 'Used as a nice visual label only',
        },
      },
      {
        name: 'folderType',
        hidden: entityType !== 'folder',
        data: {
          type: 'string',
          title: 'Folder Type',
          description: 'Type of the folder',
          enum: folderTypes.map((type) => ({
            value: type.name,
            label: type.name,
            icon: type.icon,
          })),
        },
      },
      {
        name: 'taskType',
        hidden: entityType !== 'task',
        data: {
          type: 'string',
          title: 'Task Type',
          description: 'Type of the task',
          enum: taskTypes.map((type) => ({
            value: type.name,
            label: type.name,
            icon: type.icon,
          })),
        },
      },
      {
        name: 'status',
        data: {
          type: 'string',
          title: 'Status',
          description: 'The state the entity is in, is it approved or in progress etc.',
          enum: statuses.map((status) => ({
            value: status.name,
            label: status.name,
            icon: status.icon,
            color: status.color,
          })),
        },
      },
      {
        name: 'tags',
        data: {
          type: 'list_of_strings',
          title: 'Tags',
          enum: tags.map((tag) => ({
            value: tag.name,
            label: tag.name,
            color: tag.color,
          })),
        },
      },
    ]

    const apiAttributesData: AttributeField[] = entityType
      ? attributes
          .filter((attr) => attr.scope?.includes(entityType) && attr.name !== 'description')
          .map((attr) => ({
            name: 'attrib.' + attr.name,
            data: attr.data,
          }))
      : []

    const readOnlyFieldsData: AttributeField[] = readOnlyFields.map((field) => ({
      name: field as string,
      readonly: true,
      data: {
        type: 'string',
        title: upperFirst(field as string),
      },
    }))

    const allFieldsData = [...customFieldsData, ...apiAttributesData, ...readOnlyFieldsData]
    const sortToTop = ['path', 'name']
    const sortedFieldsData = [...allFieldsData].sort((a, b) => {
      const aIndex = sortToTop.indexOf(a.name)
      const bIndex = sortToTop.indexOf(b.name)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    return sortedFieldsData
  }, [attributes, folderTypes, taskTypes, statuses, tags, entityType])

  const editableFields = fields.filter(
    (field) =>
      attributeFields.includes(field.name as keyof EntityForm) ||
      field.name.startsWith('attrib.'),
  )

  const readOnlyFieldsData = fields.filter((field) =>
    readOnlyFields.includes(field.name as keyof EntityForm),
  )

  return {
    fields,
    editableFields,
    readOnlyFieldsData,
  }
}
