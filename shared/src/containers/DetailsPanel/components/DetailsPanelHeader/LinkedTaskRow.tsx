import { Icon } from '@ynput/ayon-react-components'

import type { DetailsPanelEntityData, TaskType } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'

import * as Styled from './LinkedTaskRow.styled'

interface LinkedTaskRowProps {
  entity: DetailsPanelEntityData
  taskTypes: TaskType[]
}

const LinkedTaskRow = ({ entity, taskTypes }: LinkedTaskRowProps) => {
  const { openSlideOut } = useDetailsPanelContext()
  const { projectName } = entity

  // the optimistic version update can leave an empty task object; ignore it until it has real data
  const task = entity.task?.name ? entity.task : undefined
  if (!task?.id) return null

  const taskType = taskTypes.find((type) => type.name === task.taskType)

  return (
    <Styled.Row className="linked-task">
      <span>Task</span>
      <Styled.TaskLink
        onClick={() => openSlideOut({ entityId: task.id as string, entityType: 'task', projectName })}
      >
        <Icon icon={taskType?.icon || 'task_alt'} style={{ color: taskType?.color || undefined }} />
        <span className="label">{task.label || task.name}</span>
      </Styled.TaskLink>
    </Styled.Row>
  )
}

export default LinkedTaskRow
