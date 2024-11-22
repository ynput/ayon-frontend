// filters the tasks and folder rows by the slice type and slice value

import { SliceDataItem, useSlicerContext } from '@context/slicerContext'
import { AttributeModel } from '@api/rest/attributes'
import { Filter, FilterValue } from '@components/SearchFilter/types'
import { TaskProgressSliceType } from '@pages/TasksProgressPage/TasksProgressPage'

export type TaskFilterValue = Pick<Filter, 'id' | 'type' | 'inverted' | 'operator'> & {
  values?: Pick<FilterValue, 'id'>[]
}

interface FilterMapping {
  id: string
  type: AttributeModel['data']['type']
  mapValue: (items: SliceDataItem[]) => { id: string }[]
}

type FilterBySliceData = {
  filter: TaskFilterValue | null
}

const useFilterBySlice = (): FilterBySliceData => {
  const { sliceType, rowSelectionData } = useSlicerContext()

  const sliceTypeToFilterMap: Record<TaskProgressSliceType, FilterMapping | undefined> = {
    assignees: {
      id: 'assignees',
      type: 'list_of_strings',
      mapValue: (items) => items.map((item) => ({ id: item.name || item.id })),
    },
    status: {
      id: 'status',
      type: 'string',

      mapValue: (items) => items.map((item) => ({ id: item.name || item.id })),
    },
    taskType: {
      id: 'taskType',
      type: 'string',
      mapValue: (items) => items.map((item) => ({ id: item.name || item.id })),
    },
    hierarchy: undefined,
  }

  const filter: TaskFilterValue | null = (() => {
    const mapping = sliceTypeToFilterMap[sliceType as TaskProgressSliceType]
    if (!mapping) return null

    const selectedItems = Object.values(rowSelectionData)
    const values = mapping.mapValue(selectedItems)

    return {
      id: mapping.id,
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
