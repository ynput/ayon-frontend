// groupBy = { id: 'project', sortOrder: true }

export const getGroupedTasks = (tasks = [], groupBy = {}) => {
  const { id, sortOrder } = groupBy

  if (!id) {
    return [{ label: '_', tasks: tasks }]
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    const key = task[id] || 'other'
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(task)
    return acc
  }, {})

  const groups = Object.keys(groupedTasks).map((key) => {
    return {
      label: key,
      tasks: groupedTasks[key],
    }
  })

  if (sortOrder) {
    groups.sort((a, b) => {
      if (a.label < b.label) {
        return -1
      }
      if (a.label > b.label) {
        return 1
      }
      return 0
    })
  }

  return groups
}
