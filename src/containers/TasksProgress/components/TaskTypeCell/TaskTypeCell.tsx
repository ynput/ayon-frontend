import { FC } from 'react'
import * as Styled from './TaskTypeCell.styled'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import { $Any } from '@types'
import { EntityCard } from '@ynput/ayon-react-components'
// types
import type { EntityCardProps } from '@ynput/ayon-react-components'
import type { Status } from '@api/rest'
import type { ProgressTask } from '@queries/tasksProgress/getTasksProgress'
import type { TaskFieldChange } from '../TasksProgressTable'

interface TaskTypeCellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  statuses: Status[]
  task: ProgressTask
  assigneeOptions: EntityCardProps['assigneeOptions']
  isExpanded: boolean
  taskIcon: string
  onChange: TaskFieldChange
}

export const TaskTypeCell: FC<TaskTypeCellProps> = ({
  statuses,
  task,
  assigneeOptions,
  isExpanded,
  taskIcon,
  onChange,
  ...props
}) => {
  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]

  const status = statuses.find((s) => s.name === task.status)

  const thumbnailUrl = `/api/projects/${task.projectName}/tasks/${task.id}/thumbnail?updatedAt=${task.updatedAt}`

  let changeProps: {
    onAssigneeChange?: EntityCardProps['onAssigneeChange']
    onStatusChange?: EntityCardProps['onStatusChange']
    onPriorityChange?: EntityCardProps['onPriorityChange']
  } = {
    onAssigneeChange: undefined,
    onStatusChange: undefined,
    onPriorityChange: undefined,
  }

  const isSelected = selectedTasks.includes(task.id)

  if (isSelected) {
    changeProps = {
      onAssigneeChange: (a) => onChange(task.id, 'assignee', a),
      onStatusChange: (s) => onChange(task.id, 'status', s),
      onPriorityChange: (p) => onChange(task.id, 'priority', p),
    }
  }

  return (
    <Styled.Cell className={clsx({ selected: isSelected })} {...props}>
      <EntityCard
        variant="status"
        title={task.label || task.name}
        titleIcon={taskIcon}
        imageUrl={isExpanded ? thumbnailUrl : undefined}
        users={task.assignees.map((assignee: string) => ({ name: assignee }))}
        assigneeOptions={assigneeOptions}
        status={status}
        statusOptions={statuses}
        statusMiddle
        statusNameOnly
        priority={{
          name: 'high',
          icon: 'keyboard_double_arrow_up',
          label: 'High',
          color: '#ff0000',
        }}
        {...changeProps}
        style={{ width: 'unset', aspectRatio: 'unset' }}
        isCollapsed={!isExpanded}
        isActive
        tabIndex={undefined}
      />
    </Styled.Cell>
  )
}
