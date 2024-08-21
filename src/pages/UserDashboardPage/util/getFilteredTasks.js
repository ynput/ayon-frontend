export const getFilteredTasks = (tasks = [], filter = '', projects = []) => {
  return tasks.filter((task) => {
    const project = task.projectName

    // filter by selected projects
    if (projects.length > 0 && !projects.includes(project)) {
      return false
    }

    // return true if empty filter
    if (!filter) return true

    const taskName = task.name
    const taskFolder = task.folderName
    const taskStatus = task.status
    const taskType = task.taskType
    const taskPath = task.folderPath
    const taskAssignees = task.assigneesData.map(assignee => [assignee.name, assignee.attrib.fullName || ''].join(':')).join('::')
    const matchingStrings = [taskName, taskFolder, taskStatus, taskType, taskPath, taskAssignees]
    // filter by filter string
    const isFilterMatch = matchingStrings.some((string) => {
      if (string && string.toLowerCase().includes(filter.toLowerCase())) {
        return true
      }
      return false
    })

    return isFilterMatch
  })
}
