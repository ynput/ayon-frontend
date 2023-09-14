import { forwardRef } from 'react'
import * as Styled from './KanBanCard.styled'

const KanBanCard = forwardRef(
  (
    { task, onClick, onKeyUp, isActive, style, isOverlay, isDragging, assigneesIsMe, ...props },
    ref,
  ) => {
    return (
      <>
        <Styled.KanBanEntityCard
          ref={ref}
          id={task.id}
          imageUrl={task.thumbnailUrl}
          title={task.name}
          subTitle={task.folderName}
          description={task.path}
          onClick={onClick}
          isActive={isActive}
          icon={task.statusIcon}
          iconColor={task.statusColor}
          titleIcon={task.taskIcon}
          style={{ width: 210, ...style }}
          onKeyUp={onKeyUp}
          $isOverlay={isOverlay}
          $isDragging={isDragging}
          assignees={(!assigneesIsMe && !!task.assigneesData?.length && task.assigneesData) || null}
          {...props}
        />
      </>
    )
  },
)

KanBanCard.displayName = 'KanBanCard'

export default KanBanCard
