export const getTasksColumns = (tasks = [], splitBy = 'status', columns = []) => {
  // split into into a object with keys of unique values of splitBy
  const splitTasks = tasks.reduce((acc, task) => {
    let key = task[splitBy]
    if (!key) return acc

    key = key.toLowerCase()

    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(task)
    return acc
  }, {})

  // add columns with no tasks
  columns.forEach((key) => {
    if (!splitTasks[key.toLowerCase()]) {
      splitTasks[key.toLowerCase()] = []
    }
  })

  return splitTasks
}
