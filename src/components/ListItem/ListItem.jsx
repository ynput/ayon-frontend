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
  ...props
}) => {
  if (task.isLoading) {
    return <Styled.Item className="loading"></Styled.Item>
  }

  if (none) return <Styled.Item className="none">No tasks found</Styled.Item>

  const pathDepth = 2
  const paths = task?.path?.split('/')?.splice(1)
  // get the end of the path based on the depth
  const pathEnds = paths?.slice(-pathDepth)
  // are there more paths than the depth?
  const hasMorePaths = paths?.length > pathDepth

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
        invert
        size="icon"
        onOpen={!selected && onClick}
        multipleSelected={selectedLength}
        onChange={(v) => onUpdate('status', v)}
      />
      <Styled.ItemThumbnail src={task.thumbnailUrl} icon={task.taskIcon} />
      <Styled.Path>
        <Styled.PathItem>{task.projectCode}</Styled.PathItem>
        {hasMorePaths && <Styled.PathItem>...</Styled.PathItem>}
        {pathEnds.map((pathEnd, i, a) => (
          <Styled.PathItem key={i} className={i === a.length - 1 ? 'last' : undefined}>
            {pathEnd}
          </Styled.PathItem>
        ))}
        <Styled.Name>
          <Icon icon={task.taskIcon} />
          <span>{task.name}</span>
        </Styled.Name>
      </Styled.Path>
      <Spacer />
      {!!allUsers.length && (
        <Styled.ItemAssignees
          options={allUsers}
          value={task.assignees}
          editor
          align="right"
          size={20}
          onChange={(v) => onUpdate('assignees', v)}
          disabledValues={disabledProjectUsers}
        />
      )}
      <Styled.Date
        style={{
          color: pastEndDate
            ? isToday || isTomorrow
              ? 'var(--md-sys-color-warning)'
              : 'var(--md-sys-color-error)'
            : 'inherit',
        }}
      >
        {endDateString}
      </Styled.Date>
    </Styled.Item>
  )
}

export default ListItem
