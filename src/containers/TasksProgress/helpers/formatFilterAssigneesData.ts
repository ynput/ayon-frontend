import { BuildFilterOptions } from '@shared/components'
import { GetTasksProgressResult } from '@queries/tasksProgress/getTasksProgress'

const formatFilterAssigneesData = (
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

export default formatFilterAssigneesData
