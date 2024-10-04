import React, { forwardRef } from 'react'
import * as Styled from './ListItem.styled'
import { Icon } from '@ynput/ayon-react-components'
import { addDays, formatDistanceToNow, isSameDay, isValid } from 'date-fns'
import clsx from 'clsx'

const ListItem = forwardRef(
  (
    {
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
      priorities,
      className,
      minWidths = {},
      inView,
      ...props
    },
    ref,
  ) => {
    if (task.isLoading) {
      return <Styled.Item className="loading"></Styled.Item>
    }

    if (!inView) {
      return <Styled.Item ref={ref} tabIndex={0} id={task.id} className="placeholder"></Styled.Item>
    }

    if (none) return <Styled.Item className="none">No tasks found</Styled.Item>

    // path but with last /folderName removed
    const hoverPath = `${task.projectName}/${task.folderPath.split('/').slice(0, -1).join('/')}`

    const endDateDate = task.dueDate && new Date(task.dueDate)

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

    // remove "about" from endDateString
    if (endDateString && endDateString.startsWith('about')) {
      endDateString = endDateString.slice(6)
    }

    const listItemClass = clsx(className, {
      selected: selected,
      last: isLast,
      first: isFirst,
    })

    return (
      <Styled.Item
        className={listItemClass}
        tabIndex={0}
        id={task.id}
        onClick={onClick}
        ref={ref}
        {...props}
      >
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

        {/* FOLDER LABEL */}
        <Styled.Folder className="folder" style={{ minWidth: minWidths.folder }}>
          {task.folderLabel || task.folderName}
        </Styled.Folder>

        {/* TASK ICON AND LABEL */}
        <Styled.Task className="task" style={{ minWidth: minWidths.task }}>
          <Styled.Name className="task-icon">
            <Icon icon={task.taskIcon} />
          </Styled.Name>
          <Styled.Name className="task-label">{task.label || task.name}</Styled.Name>
        </Styled.Task>

        {/* PATH SHOW ON HOVER */}
        <Styled.Path className="path">{hoverPath}</Styled.Path>

        <Styled.ItemAssignees
          options={allUsers}
          value={task.assignees}
          align="right"
          size={18}
          onOpen={!selected && onClick}
          onChange={(v) => onUpdate('assignees', v)}
          disabledValues={disabledProjectUsers}
        />

        <Styled.PriorityEnumDropdown
          options={priorities}
          value={[task.priorityInfo?.value]}
          style={{ width: 22, height: 22 }}
          onOpen={!selected && onClick}
          onChange={(v) => onUpdate('attrib', { priority: v[0] })}
          placeholder=""
        />

        <Styled.Date className={clsx({ late: pastEndDate })}>{endDateString}</Styled.Date>
        <Styled.Code>{task.projectCode}</Styled.Code>
      </Styled.Item>
    )
  },
)

ListItem.displayName = 'ListItem'

export default ListItem
