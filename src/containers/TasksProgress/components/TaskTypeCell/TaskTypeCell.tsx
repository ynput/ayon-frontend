import { FC } from 'react'
import * as Styled from './TaskTypeCell.styled'
import clsx from 'clsx'
import { EntityCard } from '@ynput/ayon-react-components'
import { getEntityThumbnailUrl } from '@shared/util'

// types
import type { EntityCardProps } from '@ynput/ayon-react-components'
import type { Status, EnumItem } from '@shared/api'
import type { ProgressTask } from '@queries/tasksProgress/getTasksProgress'
import type { TaskFieldChange } from '../TasksProgressTable/TasksProgressTable'

interface TaskTypeCellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  statuses: Status[]
  priorities: EnumItem[]
  task: ProgressTask
  selectedAssignees: string[]
  assigneeOptions: EntityCardProps['assigneeOptions']
  isExpanded: boolean
  taskIcon: string
  isSelected: boolean
  isActive: boolean
  isMultipleSelected: boolean
  onChange: TaskFieldChange
}

export const TaskTypeCell: FC<TaskTypeCellProps> = ({
  statuses,
  priorities,
  task,
  selectedAssignees,
  assigneeOptions,
  isExpanded,
  taskIcon,
  isSelected,
  isActive,
  isMultipleSelected,
  onChange,
  ...props
}) => {
  const status = statuses.find((s) => s.name === task.status)

  const thumbnailUrl = getEntityThumbnailUrl({
    projectName: task.projectName,
    entityType: 'task',
    entityId: task.id,
    thumbnailHash: task.thumbnailHash,
  })

  let changeProps: {
    onAssigneeChange: EntityCardProps['onAssigneeChange']
    onStatusChange?: EntityCardProps['onStatusChange']
    onPriorityChange?: EntityCardProps['onPriorityChange']
  } = {
    onAssigneeChange: undefined,
    onStatusChange: undefined,
    onPriorityChange: undefined,
  }

  if (isSelected) {
    changeProps = {
      onAssigneeChange: (added) =>
        isMultipleSelected ? {} : onChange(task.id, 'assignee', added, []), // noop
      onStatusChange: (s) => onChange(task.id, 'status', s, []),
      onPriorityChange: (p) => onChange(task.id, 'priority', p, []),
    }
  }

  return (
    <Styled.Cell
      className={clsx('cell', { selected: isSelected, active: isActive })}
      {...props}
      data-tooltip={task.label || task.name}
      data-tooltip-delay={250}
    >
      <EntityCard
        variant="status"
        title={task.label || task.name}
        titleIcon={taskIcon}
        imageIcon={taskIcon}
        imageUrl={isExpanded ? thumbnailUrl ?? undefined : undefined}
        users={task.assignees.map((assignee: string) => ({ name: assignee }))}
        assigneeOptions={assigneeOptions}
        status={status}
        statusOptions={statuses}
        statusMiddle
        statusNameOnly
        priorityOptions={priorities}
        priority={priorities.find((p) => p.value === task.attrib.priority)}
        isPlayable={task.hasReviewables}
        pt={{
          assigneeSelect: {
            value: isMultipleSelected ? selectedAssignees : task.assignees,
            multiSelectClose: false,
            isMultiple: isMultipleSelected,
            multipleOverride: !isMultipleSelected,
            onAddItem: (add) =>
              isMultipleSelected ? onChange(task.id, 'assignee', [add], []) : {},
            onRemoveItem: (remove) =>
              isMultipleSelected ? onChange(task.id, 'assignee', [], [remove]) : {},
          },
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
