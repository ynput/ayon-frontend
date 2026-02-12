import { TaskSuggestionItem } from '@shared/api'
import { getEntityTypeIcon } from '../../../util'
import { TaskType } from '@shared/containers/ProjectTreeTable/types/project'

const getMentionTasks = (tasks: TaskSuggestionItem[] = [], taskTypes: TaskType[] = []) =>
  tasks.map((task) => {
    const taskType = taskTypes.find((type) => type.name === task.taskType)
    const icon = taskType?.icon || getEntityTypeIcon('task')
    const color = taskType?.color
    const label = task.label || task.name
    const context = task.parent?.name
    const suffix = ''
    const fullSearchString = `${context} ${label} ${suffix} ${task.taskType}`
    const keywords = [task.name, task.taskType, task.label, task.parent?.name, fullSearchString]

    return {
      type: 'task',
      id: task.id,
      label,
      context,
      icon,
      color,
      keywords,
      relevance: task.relevance,
    }
  })

export default getMentionTasks
