import { AttributeModel } from '../ProjectTreeTable'
import { ProjectTableAttribute } from '../ProjectTreeTable/hooks/useAttributesList'
import { SelectionData, SliceDataItem, SliceFilter, SliceType } from './types'

interface FilterMapping {
  id: string
  type: AttributeModel['data']['type']
  mapValue: (items: SliceDataItem[]) => { id: string; label: string }[]
}

export type CreateFilterFromSlicer = ({
  selection,
  type,
  attribFields,
}: {
  selection: SelectionData
  type: SliceType
  attribFields: ProjectTableAttribute[]
}) => SliceFilter | null

export const createFilterFromSlicer: CreateFilterFromSlicer = ({
  selection,
  type,
  attribFields,
}) => {
  const sliceTypeToFilterMap: Record<string, FilterMapping | undefined> = {
    assignees: {
      id: 'assignees',
      type: 'list_of_strings',
      mapValue: (items) =>
        items.map((item) => ({ id: item.name || item.id, label: item.name || '' })),
    },
    status: {
      id: 'status',
      type: 'string',

      mapValue: (items) =>
        items.map((item) => ({ id: item.name || item.id, label: item.name || '' })),
    },
    taskType: {
      id: 'taskType',
      type: 'string',
      mapValue: (items) =>
        items.map((item) => ({ id: item.name || item.id, label: item.name || '' })),
    },
    hierarchy: undefined,
  }

  const sliceFilterTypes = {
    assignees: 'list_of_strings',
    status: 'string',
    taskType: 'string',
    hierarchy: undefined,
    ...attribFields.reduce((acc, field) => {
      acc['attrib.' + field.name] = field.data.type
      return acc
    }, {} as Record<string, AttributeModel['data']['type']>),
  }

  const filter: SliceFilter | null = (() => {
    const sliceType = sliceFilterTypes[type as keyof typeof sliceFilterTypes]
    if (!sliceType) return null

    const selectedItems = Object.values(selection)
    const values = selectedItems.map((item) => ({
      id: item.id,
      label: item.label || item.name || '',
    }))

    return {
      id: type,
      label: type,
      type: sliceType,
      inverted: false,
      operator: 'OR',
      values,
    }
  })()

  return filter
}
