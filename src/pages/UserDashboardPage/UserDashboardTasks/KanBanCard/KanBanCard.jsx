import { forwardRef } from 'react'
import * as Styled from './KanBanCard.styled'

const KanBanCard = forwardRef(
  (
    {
      task,
      onClick,
      onKeyUp,
      isActive,
      style,
      isOverlay,
      isDragging,
      assigneesIsMe,
      inView,
      ...props
    },
    ref,
  ) => {
    if (!inView && inView !== undefined && !props.isLoading)
      return <div style={{ minHeight: 'var(--min-height)' }}></div>

    return (
      <>
        <Styled.KanBanEntityCard
          ref={ref}
          id={task.id}
          imageUrl={task.thumbnailUrl}
          title={task.label || task.name}
          subTitle={task.folderLabel || task.folderName}
          description={task.shortPath}
          onClick={onClick}
          isActive={isActive}
          icon={task.statusIcon}
          iconColor={task.statusColor}
          titleIcon={task.taskIcon}
          style={{ width: 210, ...style }}
          onKeyUp={onKeyUp}
          $isOverlay={isOverlay}
          $isDragging={isDragging}
          isLoading={props.isLoading}
          assignees={(!assigneesIsMe && !!task.assigneesData?.length && task.assigneesData) || null}
          {...props}
        />
      </>
    )
  },
)

KanBanCard.displayName = 'KanBanCard'

export default KanBanCard
