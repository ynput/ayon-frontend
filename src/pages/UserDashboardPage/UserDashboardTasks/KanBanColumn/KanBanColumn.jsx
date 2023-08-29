import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import React, { useEffect, useRef, useState } from 'react'

const KanBanColumn = ({ tasks = [], id, children, columns = {} }) => {
  const column = columns[id]
  const { isOver, setNodeRef, active, over } = useDroppable({
    id: id,
  })

  const tasksCount = tasks.length

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

  console.log(activeColumn, isColumnActive, isOverSelf)

  return (
    <Styled.Column ref={setNodeRef} $isOver={isOver} $active={!!active} $isOverSelf={isOverSelf}>
      <Styled.Header $color={column.color}>
        <h2>
          {column.name} - {tasksCount}
        </h2>
      </Styled.Header>
      <Styled.Items
        className="items"
        ref={itemsRef}
        $isScrolling={isScrolling}
        $isColumnActive={isColumnActive}
        $active={!!active}
      >
        {children}
      </Styled.Items>
    </Styled.Column>
  )
}

export default KanBanColumn
