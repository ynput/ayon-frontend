import { AttributeModel } from '../ProjectTreeTable'
import { SelectionData, SliceDataItem, SliceFilter, SliceType } from './types'

interface FilterMapping {
  id: string
  type: AttributeModel['data']['type']
  mapValue: (items: SliceDataItem[]) => { id: string; label: string }[]
}

export type CreateFilterFromSlicer = ({
  selection,
  type,
}: {
  selection: SelectionData
  type: SliceType
}) => SliceFilter | null

export const createFilterFromSlicer: CreateFilterFromSlicer = ({ selection, type }) => {
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

  const filter: SliceFilter | null = (() => {
    const mapping = sliceTypeToFilterMap[type]
    if (!mapping) return null

    const selectedItems = Object.values(selection)
    const values = mapping.mapValue(selectedItems)

    return {
      id: mapping.id,
      label: mapping.id,
      type: mapping.type,
      inverted: false,
      operator: 'OR',
      values,
    }
  })()

  return filter
}
