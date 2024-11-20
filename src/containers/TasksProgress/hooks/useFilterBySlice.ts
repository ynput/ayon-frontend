// filters the tasks and folder rows by the slice type and slice value

import { GetTasksProgressResult } from '@queries/tasksProgress/getTasksProgress'
import filterTasksBySearch, { FolderTask, TaskFilterValue } from '../helpers/filterTasksBySearch'
import { SliceDataItem, SliceType, useSlicerContext } from '@context/slicerContext'
import { useMemo } from 'react'
import { AttributeModel } from '@api/rest/attributes'

interface FilterMapping {
  id: string
  type: AttributeModel['data']['type']
  mapValue: (items: SliceDataItem[]) => { id: string }[]
}

type Props = {
  folders: GetTasksProgressResult
}

const useFilterBySlice = ({ folders }: Props): { folders: FolderTask[]; taskTypes: string[] } => {
  const { sliceType, rowSelectionData } = useSlicerContext()

  // TODO: fix this. It's not working
  const sliceTypeToFilterMap: Record<SliceType, FilterMapping | undefined> = {
    users: {
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
    type: undefined,
    hierarchy: undefined,
  }

  const filter: TaskFilterValue | null = (() => {
    const mapping = sliceTypeToFilterMap[sliceType]
    if (!mapping) return null

    const selectedItems = Object.values(rowSelectionData)
    const values = mapping.mapValue(selectedItems)

    return {
      id: mapping.id,
      type: mapping.type,
      inverted: false,
      values,
    }
  })()

  const filters = filter ? [filter] : []

  // filter tasks
  const filteredTasksFolders = useMemo(
    () =>
      ['hierarchy', 'taskType'].includes(sliceType)
        ? folders
        : filterTasksBySearch(folders, filters),
    [folders, filters],
  )

  // task types are filtered differently on the task progress page and doesn't use the filterTasksBySearch function
  // it uses another function after this hook, so we need to return the task types separately
  const getTaskTypes = (): string[] => {
    if (sliceType === 'taskType' && sliceTypeToFilterMap.taskType) {
      return sliceTypeToFilterMap.taskType
        .mapValue(Object.values(rowSelectionData))
        .map((item) => item.id)
    }
    return []
  }

  const taskTypes = getTaskTypes()

  return { folders: filteredTasksFolders, taskTypes }
}

export default useFilterBySlice
