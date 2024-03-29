import React from 'react'
import * as Styled from './ListItem.styled'
import { Icon, Spacer } from '@ynput/ayon-react-components'
import { addDays, formatDistanceToNow, isSameDay, isValid } from 'date-fns'
import { classNames } from 'primereact/utils'

const ListItem = ({
  task = {},
  none,
  isLast,
  isFirst,
  selected,
  selectedLength,
  statusesOptions,
  disabledStatuses,
  disabledProjectUsers,
  onClick,
  onUpdate,
  allUsers,
  className,
  minWidths = {},
  ...props
}) => {
  if (task.isLoading) {
    return <Styled.Item className="loading"></Styled.Item>
  }

  if (none) return <Styled.Item className="none">No tasks found</Styled.Item>

  // path but with last /folderName removed
  const hoverPath = task.path.split('/').slice(0, -1).join('/')

  const endDateDate = task.endDate && new Date(task.endDate)

  let isToday = '',
    pastEndDate,
    endDateString,
    isTomorrow

  if (endDateDate && isValid(endDateDate)) {
    isToday = isSameDay(endDateDate, new Date())
    isTomorrow = isSameDay(endDateDate, addDays(new Date(), 1))

    pastEndDate = endDateDate < new Date()

    if (isToday) endDateString = 'Today'
    else if (isTomorrow) endDateString = 'Tomorrow'
    else endDateString = formatDistanceToNow(endDateDate, { addSuffix: true })
  }

  const listItemClass = classNames(className, {
    selected: selected,
    last: isLast,
    first: isFirst,
  })

  return (
    <Styled.Item className={listItemClass} tabIndex={0} id={task.id} onClick={onClick} {...props}>
      <Styled.ItemStatus
        value={task.status}
        options={statusesOptions}
        disabledValues={disabledStatuses}
        size="icon"
        onOpen={!selected && onClick}
        multipleSelected={selectedLength}
        onChange={(v) => onUpdate('status', v)}
      />
      <Styled.ItemThumbnail src={task.thumbnailUrl} icon={task.taskIcon} />

      <span className="folder" style={{ minWidth: minWidths.folder }}>
        {task.folderName}
      </span>
      <Styled.Task className="task" style={{ minWidth: minWidths.task }}>
        <Styled.Name className="task-icon">
          <Icon icon={task.taskIcon} />
        </Styled.Name>
        <Styled.Name>{task.name}</Styled.Name>
      </Styled.Task>

      <Styled.Name className="path">{hoverPath}</Styled.Name>

      <Spacer />
      {!!allUsers.length && (
        <Styled.ItemAssignees
          options={allUsers}
          value={task.assignees}
          editor
          align="right"
          size={18}
          onChange={(v) => onUpdate('assignees', v)}
          disabledValues={disabledProjectUsers}
        />
      )}
      <Styled.Date className={classNames({ late: pastEndDate })}>{endDateString}</Styled.Date>
      <Styled.Code>{task.projectCode}</Styled.Code>
    </Styled.Item>
  )
}

export default ListItem
