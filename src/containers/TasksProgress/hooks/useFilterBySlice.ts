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

const useFilterBySlice = ({
  folders,
}: Props): { folders: FolderTask[]; taskTypes: string[]; folderTypes: string[] } => {
  const { sliceType, rowSelectionData } = useSlicerContext()

  const sliceTypeToFilterMap: Record<SliceType, FilterMapping | undefined> = {
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
    type: {
      id: 'type',
      type: 'string',
      mapValue: (items) => items.map((item) => ({ id: item.name || item.id })),
    },
    taskType: undefined,
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
      ['hierarchy', 'type'].includes(sliceType) || !filter?.values?.length
        ? folders
        : filterTasksBySearch(folders, filters),
    [folders, filters],
  )

  // task and folder types are filtered differently on the task progress page and doesn't use the filterTasksBySearch function
  // it uses another function after this hook, so we need to return the task types separately
  const getTypesBySubType = (): { taskTypes: string[]; folderTypes: string[] } => {
    if (sliceType !== 'type' || !rowSelectionData) {
      return { taskTypes: [], folderTypes: [] }
    }

    const selectedItems = Object.values(rowSelectionData)

    const taskTypes = selectedItems.filter((item) => item.subType === 'task').map((item) => item.id)

    const folderTypes = selectedItems
      .filter((item) => item.subType === 'folder')
      .map((item) => item.id)

    return { taskTypes, folderTypes }
  }

  const { taskTypes, folderTypes } = getTypesBySubType()

  return { folders: filteredTasksFolders, taskTypes, folderTypes }
}

export default useFilterBySlice
