// filters the tasks and folder rows by the slice type and slice value

import { SliceDataItem, useSlicerContext } from '@context/slicerContext'
import { AttributeModel } from '@api/rest/attributes'
import { FilterValue } from '@components/SearchFilter/types'

interface FilterMapping {
  id: string
  type: AttributeModel['data']['type']
  mapValue: (items: SliceDataItem[]) => { id: string; label: string }[]
}

interface SliceFilter extends FilterValue {
  values: { id: string; label: string }[]
}

type FilterBySliceData = {
  filter: SliceFilter | null
}

const useFilterBySlice = (): FilterBySliceData => {
  const { sliceType, rowSelectionData } = useSlicerContext()

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
    const mapping = sliceTypeToFilterMap[sliceType]
    if (!mapping) return null

    const selectedItems = Object.values(rowSelectionData)
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

  return {
    filter,
  }
}

export default useFilterBySlice
