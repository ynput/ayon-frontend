import React, { useMemo } from 'react'
import KanBanCard from './KanBanCard'
import * as Styled from './KanBanCard.styled'

const KanBanCardOverlay = ({ activeDraggingId, selectedTasks, tasks }) => {
  const draggingTasks = useMemo(
    () =>
      selectedTasks.flatMap((task) => {
        const foundTask = tasks.find((t) => t.id === task)
        if (!foundTask) return []
        return foundTask
      }),
    [selectedTasks, tasks, activeDraggingId],
  )

  return (
    <Styled.CardDragOverlay dropAnimation={null}>
      {draggingTasks.map((task, i) => (
        <KanBanCard
          task={task}
          isOverlay
          isActive={true}
          key={task.id}
          $index={i}
          style={{
            zIndex: -i,
          }}
        />
      ))}
    </Styled.CardDragOverlay>
  )
}

export default KanBanCardOverlay
