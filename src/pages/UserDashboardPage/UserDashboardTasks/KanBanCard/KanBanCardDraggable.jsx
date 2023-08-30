import { useDraggable } from '@dnd-kit/core'
import React from 'react'
import KanBanCard from './KanBanCard'

const KanBanCardDraggable = ({ task, onClick, onKeyUp, isActive, style, ...props }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })

  return (
    <KanBanCard
      {...{ task, onClick, onKeyUp, isActive, style, ...props }}
      ref={setNodeRef}
      isDragging={isDragging}
      {...attributes}
      {...listeners}
    />
  )
}

export default KanBanCardDraggable
