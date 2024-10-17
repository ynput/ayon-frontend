import { AttributeData } from '@api/rest/attributes'
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
        // skip taskType as it has already been filtered
        if (fieldName === 'taskType') return true
        // check if task matches at least one value in the filter
        const atLeastOneMatch = values?.some(({ id: filterValue }) => {
          if (!filterValue) return true
          let taskFieldValue: any = fieldName in task ? (task as any)[fieldName] : undefined

          // if taskFieldValue is undefined, check if it's an attrib field
          if (taskFieldValue === undefined) {
            taskFieldValue = (task.attrib as { [key: string]: any })[fieldName]
          }

          // if taskFieldValue is still, check if it's a text field
          if (taskFieldValue === undefined && fieldName !== 'text') return undefined

          if (fieldName === 'text') {
            const compareValueOnAllFields = (object: any): boolean => {
              // compare every single field on the task
              return Object.values(object).some((value: any): boolean => {
                // infer the field type from the data value
                let fieldType: AttributeData['type'] = 'string'
                if (typeof value === 'string') fieldType = 'string'
                else if (typeof value === 'number') fieldType = 'float'
                else if (Array.isArray(value)) fieldType = 'list_of_strings'
                else if (value instanceof Date) fieldType = 'datetime'
                else if (value === null || value === undefined) fieldType = 'string'
                else if (typeof value === 'object') return compareValueOnAllFields(value)
                return compareValues(value, filterValue, fieldType)
              })
            }

            return compareValueOnAllFields(task)
          } else {
            // compare the task field with the filter value
            return compareValues(taskFieldValue, filterValue, type)
          }
        })

        return inverted ? !atLeastOneMatch : atLeastOneMatch
      })

      console.log(isVisible)

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

const compareValues = (
  dataValue?: any,
  filterValue?: string,
  fieldType?: AttributeData['type'],
) => {
  // compare the task field with the filter value
  let result = false
  //   if filterValue is hasValue, check only for a value
  if (filterValue === 'hasValue') {
    result =
      dataValue !== undefined &&
      dataValue !== null &&
      (typeof dataValue === 'object' ? !isEmpty(dataValue) : dataValue !== '')
  } else if (filterValue === 'noValue') {
    result =
      typeof dataValue === 'object'
        ? isEmpty(dataValue)
        : dataValue === undefined || dataValue === null || dataValue === ''
  } else if (fieldType === 'string' && typeof dataValue === 'string' && filterValue) {
    result = dataValue?.toLowerCase().includes(filterValue?.toLowerCase())
  } else if (fieldType === 'list_of_strings' && Array.isArray(dataValue)) {
    result = dataValue?.map((v) => v.toLowerCase()).includes(filterValue?.toLowerCase())
  } else if (fieldType === 'float' || fieldType === 'integer') {
    result = dataValue === Number(filterValue)
  } else if (fieldType === 'boolean') {
    result = dataValue === (filterValue === 'true')
  } else if (fieldType === 'datetime') {
    // get which date filter to use based on id
    const dateFunction = filterDateFunctions[filterValue as keyof typeof filterDateFunctions]
    if (!dateFunction || typeof dateFunction !== 'function') result = false
    else result = dateFunction(dataValue)
  }

  if (result) {
    console.log(dataValue, filterValue, fieldType)
  }

  return result
}
