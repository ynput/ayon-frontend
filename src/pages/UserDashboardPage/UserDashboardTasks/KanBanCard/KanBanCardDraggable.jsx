import { useDraggable } from '@dnd-kit/core'
import React, { useMemo } from 'react'
import KanBanCard from './KanBanCard'

const KanBanCardDraggable = ({
  task,
  onClick,
  onKeyUp,
  isActive,
  style,
  isDraggingActive,
  isColumnActive,
  ...props
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  const card = useMemo(
    () => (
      <KanBanCard
        {...{ task, onClick, onKeyUp, isActive, style, ...props }}
        ref={setNodeRef}
        isDragging={isDragging}
        {...attributes}
        {...listeners}
      />
    ),
    [task, onClick, onKeyUp, isActive, style, props, setNodeRef, isDragging, attributes, listeners],
  )

  // prevent the card re-rendering when dragging another card
  // this massively improves performance
  const lightCard = useMemo(
    () => (
      <KanBanCard
        {...{ task, onClick, onKeyUp, isActive, style, ...props }}
        ref={setNodeRef}
        isDragging={isDragging}
        {...attributes}
        {...listeners}
        inView={isColumnActive}
      />
    ),
    [isColumnActive],
  )

  if (!isDragging && isDraggingActive && !isColumnActive) {
    return lightCard
  }

  return card
}

export default KanBanCardDraggable
