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
  const { attributes, listeners, setNodeRef, isDragging, active } = useDraggable({
    id: task.id,
  })

  const draggingCard = isDragging || (active && isActive)

  const card = useMemo(
    () => (
      <KanBanCard
        {...{ task, onClick, onKeyUp, isActive, style, ...props }}
        ref={setNodeRef}
        isDragging={draggingCard}
        {...attributes}
        {...listeners}
        onKeyDown={(e) => {
          const passThroughKeys = [' ', 'Escape']
          if (passThroughKeys.includes(e.key)) {
            // forward the event to the parent
            props.onKeyDown && props.onKeyDown(e)
          } else {
            listeners?.onKeyDown(e, task.id)
          }
        }}
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
    [isColumnActive, isActive],
  )

  if (!draggingCard && isDraggingActive && !isColumnActive) {
    return lightCard
  }

  return card
}

export default KanBanCardDraggable
