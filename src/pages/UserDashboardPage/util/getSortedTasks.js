// sortBy = [ { id: 'folderName', sortOrder: true }, { id: 'name', sortOrder: true },{ id: 'status',  sortORder: true }]

// sort in order of sortBy
export const getSortedTasks = (tasks = [], sortBy = []) => {
  return [...tasks].sort((a, b) => {
    for (let i = 0; i < sortBy.length; i++) {
      const { id, sortOrder } = sortBy[i]
      if (id.toLowerCase().includes('date')) {
        const dateA = new Date(b[id])
        const dateB = new Date(a[id])

        if (dateA < dateB) {
          return sortOrder ? -1 : 1
        }
        if (dateA > dateB) {
          return sortOrder ? 1 : -1
        }
      } else {
        if (a[id] < b[id]) {
          return sortOrder ? -1 : 1
        }
        if (a[id] > b[id]) {
          return sortOrder ? 1 : -1
        }
      }
    }
    return 0
  })
}
