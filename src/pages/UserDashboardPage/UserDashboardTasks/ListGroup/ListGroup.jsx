import React from 'react'
import { useDispatch } from 'react-redux'

import { useGetTaskContextMenu } from '@pages/UserDashboardPage/hooks'
import * as Styled from './ListGroup.styled'
import { Button } from '@ynput/ayon-react-components'
import ListItem from '@components/ListItem/ListItem'
import { InView } from 'react-intersection-observer'
import { useURIContext } from '@shared/context'
import { getTaskRoute } from '@helpers/routes'
import { useScopedDetailsPanel } from '@shared/context'
import { useNavigate } from 'react-router-dom'

const ListGroup = ({
  tasks = [],
  id,
  groups = {},
  selectedTasks = [],
  onTaskSelected,
  onTaskHover,
  statusesOptions = [],
  disabledStatuses = [],
  disabledProjectUsers = [],
  onUpdate,
  allUsers = [],
  priorities,
  onCollapseChange,
  isCollapsed,
  isLoading,
  minWidths,
  containerRef,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { setUri } = useURIContext()
  const openInOverview = (task) => {
    const taskUri = getTaskRoute(task)
    setUri(taskUri)
    if (taskUri) {
      navigate(`/projects/${task.projectName}/overview?uri=${encodeURIComponent(taskUri)}`)
    }
  }
  const column = groups[id] || {}

  const { setOpen } = useScopedDetailsPanel('dashboard')

  // OPEN DETAILS PANEL
  const onTogglePanel = (open) => {
    setOpen(open)
  }

  // CONTEXT MENU
  const { handleContextMenu, closeContext } = useGetTaskContextMenu(tasks, dispatch, {
    onOpenInOverview: openInOverview,
  })

  const handleDoubleClick = (e, task) => {
    if (e.metaKey || e.ctrlKey) {
      // get the task
      openInOverview(task)
    } else {
      onTogglePanel(true)
    }
  }

  return (
    <>
      {id !== 'none' && (
        <Styled.Header
          style={{
            borderBottomColor: !isCollapsed && (column?.color ?? 'var(--md-sys-color-outline)'),
          }}
          $isCollapsed={isCollapsed}
          onDoubleClick={() => onCollapseChange(id)}
          $isLoading={column?.isLoading}
          className="group-header"
          id={id}
        >
          {!column.isLoading && (
            <>
              <Button
                icon="expand_more"
                variant="text"
                onClick={() => onCollapseChange(id)}
                data-tooltip={'Collapse/Expand'}
                data-shortcut={'C'}
              />
              <span>
                {column?.name} - {column?.tasks?.length}
              </span>
            </>
          )}
        </Styled.Header>
      )}
      {!isCollapsed && (
        <>
          {column?.tasks?.map((task, i, a) => (
            <InView key={task.id} root={containerRef?.current} rootMargin={'50% 0px 50% 0px'}>
              {({ inView, ref }) => (
                <ListItem
                  ref={ref}
                  task={task}
                  isLast={i === a.length - 1}
                  isFirst={i === 0}
                  selected={selectedTasks.includes(task.id)}
                  selectedLength={selectedTasks.length}
                  onClick={(e) => {
                    if (e && e.detail == 2) {
                      return handleDoubleClick(e, task)
                    }
                    closeContext()
                    onTaskSelected(e, task.id, task)
                  }}
                  onContextMenu={(e) => handleContextMenu(e)}
                  onMouseOver={() => onTaskHover(task)}
                  statusesOptions={statusesOptions}
                  disabledStatuses={disabledStatuses}
                  disabledProjectUsers={disabledProjectUsers}
                  onUpdate={onUpdate}
                  allUsers={allUsers}
                  priorities={priorities}
                  className={'card'}
                  minWidths={minWidths}
                  inView={inView}
                />
              )}
            </InView>
          ))}
          {!isLoading && column?.tasks?.length === 0 && <ListItem none />}
        </>
      )}
    </>
  )
}

export default ListGroup
