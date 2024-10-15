import { BuildFilterOptions } from '@hooks/useBuildFilterOptions'
import { GetTasksProgressResult } from '@queries/tasksProgress/getTasksProgress'

const formatFilterTagsData = (data: GetTasksProgressResult): BuildFilterOptions['tagsData'] => {
  const tags: BuildFilterOptions['tagsData'] = []

  //   add tags from tasks
  data.forEach((folder) => {
    folder.tasks.forEach((task) => {
      task.tags.forEach((tag) => tags.push(tag))
    })
  })

  return tags
}

export default formatFilterTagsData
