import { isEmpty, snakeCase } from 'lodash'
// fields = [{id: 'backlog', name: 'Backlog'}, {id: 'in_progress', name: 'In Progress'}]
//
export const getTasksColumns = (tasks = [], splitBy, fields = [], users = []) => {
  let columns = fields
  let splitTasks = {}
  let noColumnTasks = []

  // group tasks by column
  fields.forEach((field) => {
    splitTasks[field.id] = { ...field, tasks: [] }
  })

  if (!splitBy) {
    noColumnTasks = tasks
  } else {
    if (isEmpty(splitTasks)) {
      // there must not be a anatomy schema for this splitBy field
      // so just return the tasks into their own columns using the splitBy as the column name
      // For example groupBy = assignee

      splitTasks = tasks.reduce((acc, task) => {
        let column = task[splitBy]
        let columnId = column
        let columnName = column

        // if column is object or array, convert column to string
        if (Array.isArray(column)) {
          columnId = column.join(', ')
        } else if (typeof column === 'object') {
          columnId = Object.keys(column).join(', ')
        }

        if (!acc[columnId]) {
          // add fullName data to column name
          if (splitBy === 'assignees') {
            // find all the users data for the column = ['name', 'name2']
            const usersData = users.filter((user) => column.includes(user.name))
            columnName = usersData.map((user) => user.fullName || user.name).join(', ')
          }

          acc[columnId] = { name: columnName, id: columnId, tasks: [] }
        }
        acc[columnId].tasks.push(task)
        return acc
      }, {})

      columns = Object.keys(splitTasks).map((key) => splitTasks[key])
    } else {
      tasks.forEach((task) => {
        const column = fields.find((field) => snakeCase(field.id) === snakeCase(task[splitBy]))

        if (column) {
          splitTasks[column.id].tasks?.push(task)
        } else {
          noColumnTasks.push(task)
        }
      })
    }
  }
  // add "No Column Found" column
  if (noColumnTasks.length > 0) {
    splitTasks['none'] = {
      name: 'None',
      id: 'none',
      color: 'var(--md-custom-color-warning)',
      tasks: noColumnTasks,
    }
  }

  columns.forEach((column) => {
    // find column in splitTasks
    const columnTasks = splitTasks[column.id]
    if (columnTasks) {
      column.tasksCount = columnTasks.tasks?.length
    }
  })

  return [splitTasks, columns]
}
