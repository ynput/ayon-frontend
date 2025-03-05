import { TaskNode } from '@api/graphql'
import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'

const priorityWeight = { low: 1, normal: 10, high: 100, urgent: 1000 }

const tasksSorter = (sortBy: SortByOption[]) => {
  const taskListSorter = (a: TaskNode, b: TaskNode) => {
    let result = 0
    // TODO Check if statuses have cardinality also - see priorities
    for (const sortOrder of sortBy) {
      if (sortOrder.id === 'status') {
        result = a.status.localeCompare(b.status) * (sortOrder.sortOrder ? 1 : -1)
        if (result !== 0) {
          return result
        }
      }
      if (sortOrder.id === 'label') {
        result =
          (a.label || a.name).localeCompare(b.label || a.name) * (sortOrder.sortOrder ? 1 : -1)
        if (result !== 0) {
          return result
        }
      }
      if (sortOrder.id === 'priority') {
        result =
          // @ts-ignore
          (priorityWeight[b.attrib.priority] - priorityWeight[a.attrib.priority]) *
          (sortOrder.sortOrder ? 1 : -1)
        if (result !== 0) {
          return result
        }
      }
    }

    return result
  }
  return taskListSorter
}

export { tasksSorter }
