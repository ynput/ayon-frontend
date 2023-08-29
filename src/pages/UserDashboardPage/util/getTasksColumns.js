import { isEmpty, snakeCase } from 'lodash'
// fields = [{id: 'backlog', name: 'Backlog'}, {id: 'in_progress', name: 'In Progress'}]
//
export const getTasksColumns = (tasks = [], splitBy, fields = []) => {
  let columns = fields
  let splitTasks = {}
  const noColumnTasks = []

  // group tasks by column
  fields.forEach((status) => {
    splitTasks[status.id] = { ...status, tasks: [] }
  })

  if (isEmpty(splitTasks)) {
    // there must not be a anatomy schema for this splitBy field
    // so just return the tasks into their own columns using the splitBy as the column name
    splitTasks = tasks.reduce((acc, task) => {
      const column = task[splitBy]
      if (!acc[column]) {
        acc[column] = { name: column, id: column, tasks: [] }
      }
      acc[column].tasks.push(task)
      return acc
    }, {})

    columns = Object.keys(splitTasks).map((key) => splitTasks[key])
  } else {
    tasks.forEach((task) => {
      const column = fields.find((status) => status.id === snakeCase(task[splitBy]))
      if (column) {
        splitTasks[column.id].tasks?.push(task)
      } else {
        noColumnTasks.push(task)
      }
    })
  }
  // add "No Column Found" column
  if (noColumnTasks.length > 0) {
    splitTasks['no_column_found'] = {
      name: 'No Column Found',
      id: 'no_column_found',
      color: 'var(--md-custom-color-warning)',
      tasks: noColumnTasks,
    }
  }

  return [splitTasks, columns]
}
