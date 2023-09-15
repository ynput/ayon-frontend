import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { getGroupedTasks } from '../../util'
import { useDispatch, useSelector } from 'react-redux'
import { onTaskSelected } from '/src/features/dashboard'
import KanBanCardDraggable from '../KanBanCard/KanBanCardDraggable'
import { useLazyGetTasksDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import KanBanCard from '../KanBanCard/KanBanCard'
import copyToClipboard from '/src/helpers/copyToClipboard'
import useCreateContext from '/src/hooks/useCreateContext'
import { Button } from '@ynput/ayon-react-components'
import { InView, useInView } from 'react-intersection-observer'

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
  const setSelectedTasks = (tasks) => dispatch(onTaskSelected(tasks))

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

    const cardsFit = Math.floor(sectionRect.height / cardHeight)
    setNumberCardsFit(cardsFit)
  }, [itemsRef.current, tasksCount])

  // find out which column the active card has come from
  const activeColumn = Object.values(columns).find((column) =>
    column.tasks.find((t) => t.id === active?.id),
  )
  const isColumnActive = activeColumn?.id === id
  const isOverSelf = over?.id === activeColumn?.id

  // we only pre-fetch on hover when the attributes panel is open
  const attributesOpen = useSelector((state) => state.dashboard.tasks.attributesOpen)

  // keep track of the ids that have been pre-fetched to avoid fetching them again
  const [preFetchedIds, setPreFetchedIds] = useState([])
  const [getTasksDetails] = useLazyGetTasksDetailsQuery()

  const handleMouseOver = (task) => {
    if (!attributesOpen) return
    if (preFetchedIds.includes(task.id)) return

    setPreFetchedIds((ids) => [...ids, task.id])

    // pre-fetch the task details
    getTasksDetails({ tasks: [task] })
  }

  const getContextMenuItems = (taskId, latestVersionId) => {
    return [
      {
        label: 'Copy task ID',
        command: () => copyToClipboard(taskId),
        icon: 'content_copy',
      },
      {
        label: 'Copy latest version ID',
        command: () => copyToClipboard(latestVersionId),
        icon: 'content_copy',
        disabled: !latestVersionId,
      },
    ]
  }

  const [showContextMenu] = useCreateContext([])

  const handleContextMenu = (e) => {
    // find the parent with className card
    let el = e.target
    const taskId = el.closest('.card')
    if (!taskId) return
    // find card
    const card = tasks.find((t) => t.id === taskId.id)

    if (!card) return

    // get context model
    const contextMenuItems = getContextMenuItems(card.id, card.latestVersionId)
    // show context menu
    showContextMenu(e, contextMenuItems)
  }

  // HANDLE TASK CLICK
  const handleTaskClick = (e, id) => {
    e.preventDefault()
    e.stopPropagation()

    const { metaKey, ctrlKey, shiftKey } = e
    const ctrlOrMeta = metaKey || ctrlKey
    const shift = shiftKey && !ctrlOrMeta

    let newSelection = [...selectedTasks]

    // metaKey or ctrlKey or shiftKey is pressed, add to selection instead of replacing
    const isMulti = ctrlOrMeta || shift

    // add (selected) to selection
    if (!newSelection.includes(id) && isMulti) {
      // add to selection
      newSelection.push(id)
    } else if (isMulti) {
      // remove from selection
      newSelection = newSelection.filter((taskId) => taskId !== id)
    } else if (!newSelection.includes(id) || newSelection.length > 1) {
      // replace selection
      newSelection = [id]
    } else {
      newSelection = []
    }

    setSelectedTasks(newSelection)

    // updates the breadcrumbs
    // let uri = `ayon+entity://${projectName}/`
    // uri += `${event.node.data.parents.join('/')}/${event.node.data.folder}`
    // uri += `?product=${event.node.data.name}`
    // uri += `&version=${event.node.data.versionName}`
    // dispatch(setUri(uri))
  }

  // return 5 fake loading events if loading
  const loadingTasks = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        id: index,
        isLoading: true,
      })),
    [],
  )

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
                <InView>
                  {({ inView, ref }) => (
                    <div ref={ref}>
                      <KanBanCardDraggable
                        task={task}
                        key={task.id}
                        onClick={(e) => handleTaskClick(e, task.id)}
                        onMouseOver={() => handleMouseOver(task)}
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
      handleMouseOver,
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
      isColumnActive={isColumnActive}
    >
      <Styled.DropColumn
        ref={setNodeRef}
        className="dropzone"
        style={{
          height: `calc(100vh - 32px - ${sectionRect?.top}px)`,
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
        $isScrolling={isScrolling}
        $isColumnActive={isColumnActive}
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
