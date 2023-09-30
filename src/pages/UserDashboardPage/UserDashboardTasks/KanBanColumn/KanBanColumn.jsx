import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { getFakeTasks, getGroupedTasks, usePrefetchTask, useTaskClick } from '../../util'
import { useDispatch, useSelector } from 'react-redux'
import KanBanCardDraggable from '../KanBanCard/KanBanCardDraggable'
import KanBanCard from '../KanBanCard/KanBanCard'
import { Button } from '@ynput/ayon-react-components'
import { InView, useInView } from 'react-intersection-observer'
import { useGetTaskContextMenu } from '../../util'
import 'react-perfect-scrollbar/dist/css/styles.css'

const KanBanColumn = ({
  tasks = [],
  id,
  groupByValue = {},
  columns = {},
  isLoading,
  allUsers = [],
  sectionRect,
}) => {
  const assigneesIsMe = useSelector((state) => state.dashboard.tasks.assigneesIsMe)

  const dispatch = useDispatch()
  const column = columns[id] || {}
  const { isOver, setNodeRef, active, over } = useDroppable({
    id: id,
  })

  const tasksCount = tasks.length

  // create groupBy labels for assignees
  const groupByLabels = useMemo(() => {
    const assigneesLabels = allUsers.map(({ name, fullName, avatarUrl }) => ({
      id: name,
      label: fullName,
      img: avatarUrl,
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
  }, [itemsRef.current, tasksCount, sectionRect?.height, active])

  // find out which column the active card has come from
  const activeColumn = Object.values(columns).find((column) =>
    column.tasks.find((t) => t.id === active?.id),
  )
  const isColumnActive = activeColumn?.id === id
  const isOverSelf = over?.id === activeColumn?.id

  // PREFETCH TASK WHEN HOVERING
  // we keep track of the ids that have been pre-fetched to avoid fetching them again
  const handlePrefetch = usePrefetchTask(dispatch)

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
            <span>{group.label}</span>
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
                        assigneesIsMe={assigneesIsMe}
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
      handlePrefetch,
      selectedTasks,
      active,
      assigneesIsMe,
      handleContextMenu,
    ],
  )

  // used to load more tasks when scrolling
  const { ref: moreButtonRef, inView } = useInView({
    root: itemsRef.current,
  })

  useEffect(() => {
    if (!inView) return
    setTaskLimit((limit) => limit + 15)
  }, [inView])

  return (
    <Styled.Column
      $isOver={isOver}
      $active={!!active}
      $isOverSelf={isOverSelf}
      $isScrolling={isScrolling}
      isColumnActive={isColumnActive}
    >
      <Styled.DropColumn
        ref={setNodeRef}
        className="dropzone"
        style={{
          height: `calc(100vh - 32px - ${sectionRect?.top}px)`,
          // display: 'none',
        }}
        $isOver={isOver}
        $isOverSelf={isOverSelf}
        $active={!!active}
      ></Styled.DropColumn>
      <Styled.Header $color={column?.color}>
        <h2>
          {column?.name} - {tasksCount}
        </h2>
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
}

export default KanBanColumn
