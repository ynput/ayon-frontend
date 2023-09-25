import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { onCollapsedColumnsChanged } from '/src/features/dashboard'
import { getFakeTasks } from '/src/pages/UserDashboardPage/util'
import { useGetTaskContextMenu } from '/src/pages/UserDashboardPage/util'
import * as Styled from './ListGroup.styled'
import { Button } from '@ynput/ayon-react-components'
import ListItem from '/src/components/ListItem/ListItem'

const ListGroup = ({
  tasks = [],
  id,
  groups = {},
  selectedTasks,
  onTaskSelected,
  onTaskHover,
  // isLoading,
  // allUsers = [],
  // index,
}) => {
  const dispatch = useDispatch()
  const column = groups[id] || {}

  // COLLAPSED GROUPS
  const collapsedGroups = useSelector((state) => state.dashboard.tasks.collapsedColumns)
  const setCollapsedGroups = (ids) => dispatch(onCollapsedColumnsChanged(ids))
  const isCollapsed = collapsedGroups.includes(id)

  const handleCollapseToggle = (id) => {
    const newCollapsedGroups = collapsedGroups.includes(id)
      ? collapsedGroups.filter((groupId) => groupId !== id)
      : [...collapsedGroups, id]
    setCollapsedGroups(newCollapsedGroups)
  }

  // CONTEXT MENU
  const handleContextMenu = useGetTaskContextMenu(tasks)

  // return 5 fake loading events if loading
  // return 5 fake loading events if loading
  const loadingTasks = useMemo(() => getFakeTasks(), [])

  return (
    <>
      <Styled.Header
        style={{
          borderBottomColor: !isCollapsed && column?.color,
        }}
        $isCollapsed={isCollapsed}
        onDoubleClick={() => handleCollapseToggle(id)}
      >
        <Button icon="expand_more" variant="text" onClick={() => handleCollapseToggle(id)} />
        <span>
          {column?.name} - {column?.tasks?.length}
        </span>
      </Styled.Header>
      {!isCollapsed && (
        <>
          {column?.tasks?.map((task, i, a) => (
            <ListItem
              key={task.id}
              task={task}
              isLast={i === a.length - 1}
              isFirst={i === 0}
              selected={selectedTasks.includes(task.id)}
              onClick={(e) => onTaskSelected(e, task.id)}
              onContextMenu={(e) => handleContextMenu(e)}
              onMouseOver={() => onTaskHover(task)}
            />
          ))}
          {!loadingTasks && column?.tasks?.length === 0 && <ListItem none />}
        </>
      )}
    </>
  )
}

export default ListGroup
