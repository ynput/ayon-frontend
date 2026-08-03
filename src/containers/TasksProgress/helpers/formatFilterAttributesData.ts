import { BuildFilterOptions } from '@shared/components'
import { FolderGroup } from '@queries/tasksProgress/getTasksProgress'

const formatFilterAttributesData = (
  data: FolderGroup[],
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

export default formatFilterAttributesData
