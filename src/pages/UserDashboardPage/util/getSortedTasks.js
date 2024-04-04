// sortBy = [ { id: 'folderName', sortOrder: true }, { id: 'name', sortOrder: true },{ id: 'status',  sortORder: true }]

// sort in order of sortBy
export const getSortedTasks = (tasks = [], sortBy = []) => {
  return [...tasks].sort((a, b) => {
    for (let i = 0; i < sortBy.length; i++) {
      const { id, sortOrder } = sortBy[i]
      const dateA = new Date(b[id])
      const dateB = new Date(a[id])
      const decreaseIfSort = sortOrder ? -1 : 1
      const increaseIfSort = sortOrder ? 1 : -1
      const isDateField = id.toLowerCase().includes('date')

      if (isDateField) {
        if (dateA < dateB) return decreaseIfSort
        if (dateA > dateB) return increaseIfSort
      } else {
        if (a[id] < b[id]) return decreaseIfSort
        if (a[id] > b[id]) return increaseIfSort
      }
    }
    return 0
  })
}
