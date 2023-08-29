import { snakeCase } from 'lodash'
// statuses = [{id: 'backlog', name: 'Backlog'}, {id: 'in_progress', name: 'In Progress'}]
//
export const getTasksColumns = (tasks = [], splitBy, statuses = []) => {
  const splitTasks = {}
  const noColumnTasks = []

  // group tasks by column
  statuses.forEach((status) => {
    splitTasks[status.id] = { ...status, tasks: [] }
  })

  tasks.forEach((task) => {
    const column = statuses.find((status) => status.id === snakeCase(task[splitBy]))
    if (column) {
      splitTasks[column.id].tasks?.push(task)
    } else {
      noColumnTasks.push(task)
    }
  })

  // add "No Column Found" column
  if (noColumnTasks.length > 0) {
    splitTasks['no_column_found'] = {
      name: 'No Column Found',
      id: 'no_column_found',
      color: 'var(--md-custom-color-warning)',
      tasks: noColumnTasks,
    }
  }

  return splitTasks
}
