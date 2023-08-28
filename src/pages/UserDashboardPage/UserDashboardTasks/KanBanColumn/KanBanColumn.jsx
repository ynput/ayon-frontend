import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import React, { useEffect, useRef, useState } from 'react'

const KanBanColumn = ({ tasks = [], id, children, columns = {} }) => {
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
  const activeColumn = columns[active?.id]
  const isColumnActive = activeColumn?.id === id
  const isOverSelf = over?.id === activeColumn?.id

  return (
    <Styled.Column ref={setNodeRef} $isOver={isOver} $active={!!active} $isOverSelf={isOverSelf}>
      <Styled.Header>
        <h2>
          {id} - {tasksCount}
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
