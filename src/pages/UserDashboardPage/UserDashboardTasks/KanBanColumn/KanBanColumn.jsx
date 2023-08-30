import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import React, { Fragment, useEffect, useRef, useState } from 'react'
import { getGroupedTasks } from '../../util'
import { useDispatch, useSelector } from 'react-redux'
import { onTaskSelected } from '/src/features/dashboard'
import KanBanCardDraggable from '../KanBanCard/KanBanCardDraggable'

const KanBanColumn = ({ tasks = [], id, groupByValue = {}, columns = {} }) => {
  const dispatch = useDispatch()
  const column = columns[id] || {}
  const { isOver, setNodeRef, active, over } = useDroppable({
    id: id,
  })

  const tasksCount = tasks.length

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

  // HANDLE TASK CLICK
  const handleTaskClick = (e, id) => {
    e.preventDefault()
    e.stopPropagation()

    const { metaKey, ctrlKey, shiftKey } = e
    const ctrlOrMeta = metaKey || ctrlKey
    const shift = shiftKey && !ctrlOrMeta

    let newSelection = []

    // metaKey or ctrlKey or shiftKey is pressed, add to selection instead of replacing
    if (ctrlOrMeta || shift) {
      newSelection = [...selectedTasks]
    }

    // add (selected) to selection
    if (!newSelection.includes(id)) {
      // add to selection
      newSelection.push(id)
    } else if (ctrlOrMeta) {
      // remove from selection
      newSelection = newSelection.filter((taskId) => taskId !== id)
    }

    setSelectedTasks(newSelection)
    // updates the breadcrumbs
    // let uri = `ayon+entity://${projectName}/`
    // uri += `${event.node.data.parents.join('/')}/${event.node.data.folder}`
    // uri += `?product=${event.node.data.name}`
    // uri += `&version=${event.node.data.versionName}`
    // dispatch(setUri(uri))
  }

  return (
    <Styled.Column ref={setNodeRef} $isOver={isOver} $active={!!active} $isOverSelf={isOverSelf}>
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
        {getGroupedTasks(column?.tasks, groupByValue[0]).map((group) => (
          <Fragment key={group.label}>
            <span>{group.label}</span>
            {group.tasks.map((task) => (
              <KanBanCardDraggable
                task={task}
                key={task.id}
                onClick={(e) => handleTaskClick(e, task.id)}
                isActive={selectedTasks.includes(task.id)}
                className="card"
              />
            ))}
          </Fragment>
        ))}
      </Styled.Items>
    </Styled.Column>
  )
}

export default KanBanColumn
