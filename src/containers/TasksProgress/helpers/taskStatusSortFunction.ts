import type { Status } from '@shared/api'
import { TaskTypeRow } from './formatTaskProgressForTable'
import { stateOrder } from '../components/TaskStatusBar/TaskStatusBar'
import { ProgressTableSortFunction } from '../hooks/useFolderSort'

export const taskStatusSortFunction =
  (statuses: Status[]): ProgressTableSortFunction =>
  (a, b, { field, order }): number => {
    // get status (state) with the highest index in stateOrder
    const findStatus = (tasks: TaskTypeRow['tasks']) => {
      let currentHighestStateIndex = 0
      let pickedStatus: string | undefined

      tasks.forEach((task) => {
        const status = statuses.find((s) => s.name === task.status)
        if (!status || !status.state) return

        const statusIndex = stateOrder.indexOf(status.state)

        if (statusIndex > currentHighestStateIndex) {
          currentHighestStateIndex = statusIndex
          pickedStatus = task.status
        }
      })

      return pickedStatus || (tasks[0] ? tasks[0].status : -1)
    }

    const isParent = a.__isParent || b.__isParent
    const taskTypeA = a[field] as TaskTypeRow | undefined
    const taskTypeB = b[field] as TaskTypeRow | undefined

    const folderSort = () => {
      // compare the tasks by their status for that taskType
      const statusA = taskTypeA && findStatus(taskTypeA.tasks)
      const statusB = taskTypeB && findStatus(taskTypeB.tasks)
      const orderValue = order === 1 ? 1 : -1
      const statusIndexA = statuses.findIndex((s) => s.name === statusA)
      const statusIndexB = statuses.findIndex((s) => s.name === statusB)

      return (statusIndexA - statusIndexB) * orderValue
    }

    // parent sort by folder name
    const parentSort = () => {
      const folderA = a._folder
      const folderB = b._folder

      return folderA.localeCompare(folderB)
    }

    if (isParent) {
      return parentSort()
    } else {
      return folderSort()
    }
  }
