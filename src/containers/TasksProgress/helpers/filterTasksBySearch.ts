import getFilterFromId from '@components/SearchFilter/getFilterFromId'
import { Filter } from '@components/SearchFilter/types'
import { filterDateFunctions } from '@hooks/useBuildFilterOptions'
import {
  GetTasksProgressResult,
  ProgressTask,
  ProgressTaskFolder,
} from '@queries/tasksProgress/getTasksProgress'
import { isEmpty } from 'lodash'

export interface FolderTask extends ProgressTaskFolder {
  projectName: string
  tasks: (ProgressTask & { isHidden?: boolean })[]
}

const filterTasksBySearch = (folders: GetTasksProgressResult, filters: Filter[]): FolderTask[] => {
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

          // compare the task field with the filter value
          let result = false
          //   if filterValue is hasValue, check only for a value
          if (filterValue === 'hasValue') {
            result =
              taskFieldValue !== undefined &&
              taskFieldValue !== null &&
              (typeof taskFieldValue === 'object'
                ? !isEmpty(taskFieldValue)
                : taskFieldValue !== '')
          } else if (filterValue === 'noValue') {
            result =
              typeof taskFieldValue === 'object'
                ? isEmpty(taskFieldValue)
                : taskFieldValue === undefined || taskFieldValue === null || taskFieldValue === ''
          } else if (type === 'string') {
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
