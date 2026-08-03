import { BuildFilterOptions } from '@shared/components'
import { FolderGroup } from '@queries/tasksProgress/getTasksProgress'

const formatFilterTagsData = (data: FolderGroup[]): BuildFilterOptions['data']['tags'] => {
  const tags: BuildFilterOptions['data']['tags'] = []

  //   add tags from tasks
  data.forEach((folder) => {
    folder.tasks.forEach((task) => {
      task.tags.forEach((tag) => tags.push(tag))
    })
  })

  return tags
}

export default formatFilterTagsData
