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
  ...props
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  let card = useMemo(
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
  const lightCard = useMemo(() => card, [])

  if (!isDragging && isDraggingActive) {
    card = lightCard
  }

  return card
}

export default KanBanCardDraggable
