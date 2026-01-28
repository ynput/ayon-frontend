import * as Styled from './KanBanColumn.styled'
import React, { Fragment, forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { getFakeTasks, getGroupedTasks } from '../../util'
import { useGetTaskContextMenu, useTaskClick, usePrefetchEntity } from '../../hooks'
import { useDispatch, useSelector } from 'react-redux'
import KanBanCardDraggable from '../KanBanCard/KanBanCardDraggable'
import KanBanCard from '../KanBanCard/KanBanCard'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { InView, useInView } from 'react-intersection-observer'
import 'react-perfect-scrollbar/dist/css/styles.css'
import KanBanColumnDropzone from './KanBanColumnDropzone'
import clsx from 'clsx'
import { useURIContext } from '@shared/context'
import { getTaskRoute } from '@helpers/routes'
import { useScopedDetailsPanel } from '@shared/context'
import { useNavigate } from 'react-router-dom'

const KanBanColumn = forwardRef(
  (
    {
      allTasks = [],
      tasks = [],
      id,
      groupByValue = {},
      groupItems = [],
      column = {},
      isLoading,
      projectUsers = [],
      disabledStatuses,
      sectionRect,
      sectionRef,
      onToggleCollapse,
      active,
      activeColumn,
      projectsInfo,
      priorities,
    },
    ref,
  ) => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const tasksCount = tasks.length

    // create groupBy labels for assignees
    const groupByAnatomy = useMemo(() => {
      const assignees = projectUsers.map(({ name, attrib }) => ({
        img: name && `/api/users/${name}/avatar`,
        value: name,
        label: attrib?.fullName || name,
      }))

      return {
        assignees: assignees,
        priority: priorities,
      }
    }, [projectUsers, priorities])

    // SELECTED TASKS
    const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)

    const [numberCardsFit, setNumberCardsFit] = useState(15)
    const [isScrolling, setIsScrolling] = useState(false)

    const itemsRef = useRef(null)
    // figure if the column items are overflowing and scrolling
    useEffect(() => {
      const el = itemsRef.current
      if (!el) return
      // now work out if the items are overflowing
      const isOverflowing = el.scrollHeight > el.clientHeight
      setIsScrolling(isOverflowing)
      const cardHeight = 118

      const cardsFit = Math.floor(sectionRect?.height / cardHeight)
      setNumberCardsFit(cardsFit)
    }, [itemsRef.current, tasksCount, sectionRect?.height])

    const isColumnActive = activeColumn?.id === id

    // PREFETCH TASK WHEN HOVERING
    // we keep track of the ids that have been pre-fetched to avoid fetching them again
    const handlePrefetch = usePrefetchEntity(dispatch, projectsInfo, 500, 'dashboard')

    const { setUri } = useURIContext()
    const openInBrowser = async (task) => {
      const taskUri = getTaskRoute(task)
      setUri(taskUri)

      // // navigate to browser page with uri as query param
      if (taskUri) {
        navigate(`/projects/${task.projectName}/browser?uri=${encodeURIComponent(taskUri)}`)
      }
    }

    // CONTEXT MENU
    const { handleContextMenu, closeContext } = useGetTaskContextMenu(tasks, dispatch, {
      onOpenInBrowser: openInBrowser,
    })

    // HANDLE TASK CLICK
    const handleTaskClick = useTaskClick(dispatch, allTasks, closeContext)

    const handleDoubleClick = (e, task) => {
      if (e.metaKey || e.ctrlKey) {
        // get the task
        openInBrowser(task)
      } else {
        onTogglePanel(true)
      }
    }

    const { setOpen } = useScopedDetailsPanel('dashboard')

    // OPEN DETAILS PANEL
    const onTogglePanel = (open) => {
      setOpen(open)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Check if the focus is on an input field
        const focusedElement = document.activeElement
        const isInputFocused =
          focusedElement?.tagName === 'INPUT' ||
          focusedElement?.tagName === 'TEXTAREA' ||
          focusedElement?.contentEditable === 'true'

        if (!isInputFocused) {
          onTogglePanel(true)
        }
      }
    }

    // return 5 fake loading events if loading
    const loadingTasks = useMemo(() => getFakeTasks(), [])

    const groupedTasks = useMemo(
      () => getGroupedTasks(tasks, groupByValue[0], groupByAnatomy),
      [tasks, groupByValue, groupByAnatomy],
    )

    let [taskLimit, setTaskLimit] = useState(10)

    // only when hovering over the column show full taskLimit
    // otherwise show the number of cards that fit in the column
    if (active && !isColumnActive) taskLimit = numberCardsFit - 1

    let tasksAdded = 0

    const allGroupedTasks = useMemo(
      () =>
        groupedTasks.flatMap((group) =>
          tasksAdded >= taskLimit ? (
            []
          ) : (
            <Fragment key={group.label}>
              {group.label && <Styled.GroupHeader>{group.label}</Styled.GroupHeader>}
              {group.tasks.flatMap((task, i) => {
                if (tasksAdded >= taskLimit) return []
                tasksAdded++
                return (
                  <InView key={task.id}>
                    {({ inView, ref }) => (
                      <div ref={ref}>
                        <KanBanCardDraggable
                          task={task}
                          onClick={(e) => {
                            if (e.detail === 1) {
                              handleTaskClick(e, task.id)
                            } else handleDoubleClick(e, task)
                          }}
                          onTitleClick={(e) => handleTaskClick(e, task.id, undefined, true)}
                          onKeyDown={handleKeyDown}
                          onMouseOver={() => handlePrefetch(task)}
                          isActive={selectedTasks.includes(task.id)}
                          isDraggingActive={active}
                          className="card"
                          onContextMenu={handleContextMenu}
                          inView={inView || i <= numberCardsFit}
                        />
                      </div>
                    )}
                  </InView>
                )
              })}
            </Fragment>
          ),
        ),
      [
        groupedTasks,
        handleTaskClick,
        handleKeyDown,
        handlePrefetch,
        selectedTasks,
        active,
        handleContextMenu,
      ],
    )

    // used to load more tasks when scrolling
    const { ref: moreButtonRef, inView } = useInView({
      root: sectionRef.current,
    })

    useEffect(() => {
      if (!inView) return
      setTaskLimit((limit) => limit + 15)
    }, [inView])

    return (
      <Styled.Column ref={ref} id={id}>
        <Styled.DropColumnWrapper
          className={clsx('dropzone', { 'drop-active': active })}
          style={{
            height: `calc(100vh - 32px - ${sectionRect?.top}px)`,
          }}
        >
          {active &&
            groupItems.map((item) => (
              <KanBanColumnDropzone
                item={item}
                key={item.id}
                activeColumn={activeColumn}
                disabled={disabledStatuses.includes(item.name)}
              />
            ))}
        </Styled.DropColumnWrapper>
        <Styled.Header $color={column?.color} className={clsx({ dragging: !!active })}>
          <h2
            style={{
              opacity: active ? 0 : 1,
            }}
          >
            {column?.name} - {tasksCount}
          </h2>
          <Toolbar>
            {/* collapses the columns */}
            <Styled.MenuButton
              icon="chevron_left"
              variant="text"
              className="collapse"
              onClick={onToggleCollapse}
            />
          </Toolbar>
        </Styled.Header>

        <Styled.Items
          className={clsx('items', { dragging: !!active })}
          ref={itemsRef}
          style={{ overflow: active && !isColumnActive && !isScrolling && 'hidden' }}
        >
          {allGroupedTasks}
          {!isLoading && tasksCount !== tasksAdded && !active && (
            <Button
              label="Load More"
              onClick={() => setTaskLimit(taskLimit + 15)}
              ref={moreButtonRef}
              style={{ width: '100%' }}
            />
          )}
          {active && tasksAdded !== tasksCount && (
            <span>{tasksCount - tasksAdded > 0 ? `+ ${tasksCount - tasksAdded} more` : ''}</span>
          )}
          {isLoading &&
            loadingTasks.map((task) => <KanBanCard task={task} key={task.id} isLoading />)}
        </Styled.Items>
      </Styled.Column>
    )
  },
)

KanBanColumn.displayName = 'KanBanColumn'

export default KanBanColumn
