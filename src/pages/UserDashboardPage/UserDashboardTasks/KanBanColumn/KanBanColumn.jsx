import * as Styled from './KanBanColumn.styled'
import React, { Fragment, forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { getFakeTasks, getGroupedTasks, usePrefetchEntity, useTaskClick } from '../../util'
import { useDispatch, useSelector } from 'react-redux'
import KanBanCardDraggable from '../KanBanCard/KanBanCardDraggable'
import KanBanCard from '../KanBanCard/KanBanCard'
import { Button, Toolbar } from '@ynput/ayon-react-components'
import { InView, useInView } from 'react-intersection-observer'
import { useGetTaskContextMenu } from '../../util'
import 'react-perfect-scrollbar/dist/css/styles.css'
import KanBanColumnDropzone from './KanBanColumnDropzone'

const KanBanColumn = forwardRef(
  (
    {
      tasks = [],
      id,
      groupByValue = {},
      groupItems = [],
      column = {},
      isLoading,
      allUsers = [],
      disabledStatuses,
      sectionRect,
      sectionRef,
      onToggleCollapse,
      active,
      activeColumn,
      projectsInfo,
    },
    ref,
  ) => {
    const dispatch = useDispatch()

    const tasksCount = tasks.length

    // create groupBy labels for assignees
    const groupByLabels = useMemo(() => {
      const assigneesLabels = allUsers.map(({ name }) => ({
        img: name && `/api/users/${name}/avatar`,
      }))

      return {
        assignees: assigneesLabels,
      }
    }, [allUsers])

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

    // CONTEXT MENU
    const { handleContextMenu, closeContext } = useGetTaskContextMenu(tasks, dispatch)

    // HANDLE TASK CLICK
    const handleTaskClick = useTaskClick(dispatch)

    // return 5 fake loading events if loading
    const loadingTasks = useMemo(() => getFakeTasks(), [])

    const groupedTasks = useMemo(
      () => getGroupedTasks(tasks, groupByValue[0], groupByLabels),
      [tasks, groupByValue, groupByLabels],
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
              <Styled.GroupHeader>{group.label}</Styled.GroupHeader>
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
                            closeContext()
                            handleTaskClick(e, task.id)
                          }}
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
      [groupedTasks, handleTaskClick, handlePrefetch, selectedTasks, active, handleContextMenu],
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
          className="dropzone"
          style={{
            height: `calc(100vh - 32px - ${sectionRect?.top}px)`,
            // display: 'none',
          }}
          $active={!!active}
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
        <Styled.Header $color={column?.color}>
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
          className="items"
          ref={itemsRef}
          style={{ overflow: active && !isColumnActive && !isScrolling && 'hidden' }}
          $active={!!active}
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
            loadingTasks.map((task) => <KanBanCard task={task} key={task.id} isLoading={true} />)}
        </Styled.Items>
      </Styled.Column>
    )
  },
)

KanBanColumn.displayName = 'KanBanColumn'

export default KanBanColumn
