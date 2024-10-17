import getFilterFromId from '@components/SearchFilter/getFilterFromId'
import { Filter } from '@components/SearchFilter/types'
import { filterDateFunctions, FilterFieldType } from '@hooks/useBuildFilterOptions'
import {
  GetTasksProgressResult,
  ProgressTask,
  ProgressTaskFolder,
} from '@queries/tasksProgress/getTasksProgress'

export interface FolderTask extends ProgressTaskFolder {
  projectName: string
  tasks: (ProgressTask & { isHidden?: boolean })[]
}

const filterTasksBySearch = (
  folders: GetTasksProgressResult,
  filters: Filter[],
  filterTypes: FilterFieldType[],
): FolderTask[] => {
  if (!filters.length) return folders

  const filtered = folders.map((folder) => {
    const filteredTasks = folder.tasks.map((task) => {
      // check the task matches all filters
      const isVisible = filters.every(({ values, id, type, inverted }) => {
        const fieldName = getFilterFromId(id)
        // check if task matches at least one value in the filter
        const atLeastOneMatch = values?.some(({ id: filterValue }) => {
          if (!filterValue) return true
          let taskFieldValue: any = fieldName in task ? (task as any)[fieldName] : undefined
          // if taskFieldValue is undefined, check if it's an attrib field
          if (taskFieldValue === undefined) {
            taskFieldValue = (task.attrib as { [key: string]: any })[fieldName]
          }

          // if taskFieldValue is still undefined, return true
          if (taskFieldValue === undefined) return false

          let result = false
          // compare the task field with the filter value
          if (type === 'string') {
            result = taskFieldValue.toLowerCase().includes(filterValue.toLowerCase())
          } else if (type === 'list_of_strings' && Array.isArray(taskFieldValue)) {
            result = taskFieldValue.map((v) => v.toLowerCase()).includes(filterValue.toLowerCase())
          } else if (type === 'float' || type === 'integer') {
            result = taskFieldValue === Number(filterValue)
          } else if (type === 'boolean') {
            result = taskFieldValue === (filterValue === 'true')
          } else if (type === 'datetime') {
            // get which date filter to use based on id
            const dateFunction =
              filterDateFunctions[filterValue as keyof typeof filterDateFunctions]
            if (!dateFunction || typeof dateFunction !== 'function') result = false
            else result = dateFunction(taskFieldValue)
          }

          return result
        })

        return inverted ? !atLeastOneMatch : atLeastOneMatch
      })

      return { ...task, isHidden: !isVisible }
    })

    return {
      ...folder,
      tasks: filteredTasks,
    }
  })

  return filtered
}

export default filterTasksBySearch
