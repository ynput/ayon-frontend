import { matchSearchQuery, parseSearchQuery } from '@shared/util/searchTerms'

export const getFilteredTasks = (tasks = [], filter = '', projects = []) => {
  const searchGroups = parseSearchQuery(filter)
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

    return matchSearchQuery(matchingStrings.filter(Boolean).join(' '), searchGroups).passed
  })
}
