import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { getGroupedTasks } from '../../util'
import { useDispatch, useSelector } from 'react-redux'
import { onTaskSelected } from '/src/features/dashboard'
import KanBanCardDraggable from '../KanBanCard/KanBanCardDraggable'
import { useLazyGetTasksDetailsQuery } from '/src/services/userDashboard/getUserDashboard'
import KanBanCard from '../KanBanCard/KanBanCard'

const KanBanColumn = ({
  tasks = [],
  id,
  groupByValue = {},
  columns = {},
  isLoading,
  allUsers = [],
}) => {
  const columnRef = useRef(null)
  const assigneesIsMe = useSelector((state) => state.dashboard.tasks.assigneesIsMe)

  // we get column top position to figure out how high to make droppable area
  const [columnTop, setColumnTop] = useState(null)

  useEffect(() => {
    if (!columnRef.current) return
    const { top } = columnRef.current.getBoundingClientRect()
    setColumnTop(top)
  }, [columnRef.current])

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

  const [isScrolling, setIsScrolling] = useState(false)
  const itemsRef = useRef(null)
  // figure if the column items are overflowing and scrolling
  useEffect(() => {
    const el = itemsRef.current
    if (!el) return
    // now work out if the items are overflowing
    const isOverflowing = el.scrollHeight > el.clientHeight
    setIsScrolling(isOverflowing)
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
      Array.from({ length: 3 }, (_, index) => ({
        id: index,
        isLoading: true,
      })),
    [],
  )

  const groupedTasks = useMemo(
    () => getGroupedTasks(tasks, groupByValue[0], groupByLabels),
    [tasks, groupByValue, groupByLabels],
  )

  return (
    <Styled.Column $isOver={isOver} $active={!!active} $isOverSelf={isOverSelf} ref={columnRef}>
      <Styled.DropColumn
        ref={setNodeRef}
        className="dropzone"
        style={{
          height: `calc(100vh - 32px - ${columnTop}px)`,
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
        {groupedTasks.map((group) => (
          <Fragment key={group.label}>
            <span>{group.label}</span>
            {group.tasks.map((task) => (
              <KanBanCardDraggable
                task={task}
                key={task.id}
                onClick={(e) => handleTaskClick(e, task.id)}
                onMouseOver={() => handleMouseOver(task)}
                isActive={selectedTasks.includes(task.id)}
                isDraggingActive={active}
                className="card"
                assigneesIsMe={assigneesIsMe}
              />
            ))}
          </Fragment>
        ))}
        {isLoading &&
          loadingTasks.map((task) => <KanBanCard task={task} key={task.id} isLoading={true} />)}
      </Styled.Items>
    </Styled.Column>
  )
}

export default KanBanColumn
