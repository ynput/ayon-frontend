// groupBy = { id: 'project', sortOrder: true }

export const getGroupedTasks = (tasks = [], groupBy = {}, anatomies = {}) => {
  const { id, sortOrder, sortByEnumOrder } = groupBy

  if (!id) {
    return [{ label: '', tasks: tasks }]
  }

  const anatomy = anatomies[id] || []

  const groupedTasks = Object.values(
    tasks.reduce((acc, task) => {
      let value = task[id] || 'other'
      let label
      let indexOrder

      if (Array.isArray(value)) {
        label = value
          .map((k) => {
            const groupLabel = anatomy.find((l) => l.value === k) || { label: k }
            return groupLabel.label
          })
          .join(', ')
        value = value.join(', ')
        indexOrder = value.length
      } else {
        const groupLabel = anatomy.find((l) => l.value === value) || { label: value }
        label = groupLabel.label
        const enumIndex = anatomy.findIndex((l) => l.value === value)
        indexOrder = enumIndex
      }

      if (!acc[value]) {
        acc[value] = { value, label, indexOrder, tasks: [] }
      }
      acc[value].tasks.push(task)
      return acc
    }, {}),
  )

  const groups = groupedTasks
    .sort((a, b) => {
      let aVal = a.label || ''
      let bVal = b.label || ''

      if (sortByEnumOrder) {
        aVal = a.indexOrder
        bVal = b.indexOrder
      }

      const order = sortOrder ? -1 : 1
      if (aVal < bVal) {
        return -1 * order
      }
      if (aVal > bVal) {
        return 1 * order
      }
      return 0
    })
    .map((group) => {
      return {
        label: group.value,
        tasks: group.tasks,
      }
    })

  return groups
}
