export const getTasksColumns = (tasks = [], splitBy = 'status', columns = []) => {
  // split into into a object with keys of unique values of splitBy
  const splitTasks = tasks.reduce((acc, task) => {
    const key = task[splitBy]
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(task)
    return acc
  }, {})

  // add columns with no tasks
  columns.forEach((key) => {
    if (!splitTasks[key]) {
      splitTasks[key] = []
    }
  })

  return splitTasks
}
