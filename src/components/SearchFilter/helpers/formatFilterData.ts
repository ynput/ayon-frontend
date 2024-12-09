import { BuildFilterOptions } from '@hooks/useBuildFilterOptions'
import { GetTasksProgressResult } from '@queries/tasksProgress/getTasksProgress'

export const formatFilterAssigneesData = (
  data: GetTasksProgressResult,
): BuildFilterOptions['data']['assignees'] => {
  const assignees: BuildFilterOptions['data']['assignees'] = []

  //   add assignees from tasks
  data.forEach((folder) => {
    folder.tasks.forEach((task) => {
      task.assignees.forEach((tag) => assignees.push(tag))
    })
  })

  return assignees
}

export const formatFilterAttributesData = (
  data: GetTasksProgressResult,
): BuildFilterOptions['data']['attributes'] => {
  const attributes: BuildFilterOptions['data']['attributes'] = {}

  //   add attributes from tasks
  data.forEach((folder) => {
    folder.tasks.forEach((task) => {
      Object.entries(task.attrib).forEach(([key, value]) => {
        if (!attributes[key]) {
          attributes[key] = []
        }

        attributes[key].push(value)
      })
    })
  })

  return attributes
}

export const formatFilterTagsData = (
  data: GetTasksProgressResult,
): BuildFilterOptions['data']['tags'] => {
  const tags: BuildFilterOptions['data']['tags'] = []

  //   add tags from tasks
  data.forEach((folder) => {
    folder.tasks.forEach((task) => {
      task.tags.forEach((tag) => tags.push(tag))
    })
  })

  return tags
}
