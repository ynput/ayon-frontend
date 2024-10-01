import sortByOptions from '../UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'

// sort in order of sortBy
export const getSortedTasks = (tasks = [], sortBy = []) => {
  return [...tasks].sort((a, b) => {
    for (let i = 0; i < sortBy.length; i++) {
      const { id, sortOrder } = sortBy[i]

      const sortOption = sortByOptions.find((option) => option.id === id)
      const fallbacks = sortOption?.fallbacks || []
      const aVal = a[id] || fallbacks.reduce((acc, fallback) => acc || a[fallback], null)
      const bVal = b[id] || fallbacks.reduce((acc, fallback) => acc || b[fallback], null)

      const dateA = new Date(aVal)
      const dateB = new Date(bVal)
      const decreaseIfSort = sortOrder ? -1 : 1
      const increaseIfSort = sortOrder ? 1 : -1
      const isDateField = id.toLowerCase().includes('date')

      if (isDateField) {
        if (dateA < dateB) return decreaseIfSort
        if (dateA > dateB) return increaseIfSort
      } else {
        if (aVal < bVal) return decreaseIfSort
        if (aVal > bVal) return increaseIfSort
      }
    }
    return 0
  })
}
