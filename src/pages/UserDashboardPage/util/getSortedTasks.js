import sortByOptions from '../UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'

// sort in order of sortBy
export const getSortedTasks = (tasks = [], sortBy = [], anatomy = {}) => {
  return [...tasks].sort((a, b) => {
    for (let i = 0; i < sortBy.length; i++) {
      const { id, sortOrder } = sortBy[i]
      const { sortByEnumOrder, fallbacks = [] } =
        sortByOptions.find((option) => option.id === id) || {}

      let aVal = a[id] || fallbacks.reduce((acc, fallback) => acc || a[fallback], null)
      let bVal = b[id] || fallbacks.reduce((acc, fallback) => acc || b[fallback], null)

      if (anatomy[id] && sortByEnumOrder) {
        aVal = anatomy[id].findIndex((option) => option.value === aVal)
        bVal = anatomy[id].findIndex((option) => option.value === bVal)
      }

      const dateA = new Date(aVal)
      const dateB = new Date(bVal)
      const decreaseIfSort = sortOrder ? -1 : 1
      const increaseIfSort = sortOrder ? 1 : -1
      const isDateField = id.toLowerCase().includes('date')

      if (isDateField) {
        if (dateA < dateB) return decreaseIfSort
        if (dateA > dateB) return increaseIfSort
      } else {
        if (aVal > bVal) return decreaseIfSort
        if (aVal < bVal) return increaseIfSort
      }
    }
    return 0
  })
}
