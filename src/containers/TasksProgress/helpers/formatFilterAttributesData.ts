import { BuildFilterOptions } from '@hooks/useBuildFilterOptions'
import { GetTasksProgressResult } from '@queries/tasksProgress/getTasksProgress'

const formatFilterAttributesData = (
  data: GetTasksProgressResult,
): BuildFilterOptions['attributesData'] => {
  const attributes: BuildFilterOptions['attributesData'] = {}

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
