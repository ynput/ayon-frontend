// groupBy = { id: 'project', sortOrder: true }

export const getGroupedTasks = (tasks = [], groupBy = {}, labelsAll = {}) => {
  const { id, sortOrder } = groupBy

  if (!id) {
    return [{ label: '', tasks: tasks }]
  }

  const labels = labelsAll[id] || []

  const groupedTasks = tasks.reduce((acc, task) => {
    let key = task[id] || 'other'
    if (Array.isArray(key)) {
      key = key
        .map((k) => {
          const groupLabel = labels.find((l) => l.id === k) || { label: k }
          return groupLabel.label
        })
        .join(', ')
    } else {
      const groupLabel = labels.find((l) => l.id === key) || { label: key }
      key = groupLabel.label
    }
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

  groups.sort((a, b) => {
    const order = sortOrder ? -1 : 1
    if (a.label < b.label) {
      return -1 * order
    }
    if (a.label > b.label) {
      return 1 * order
    }
    return 0
  })

  return groups
}
