import { forwardRef } from 'react'
import * as Styled from './KanBanCard.styled'
import clsx from 'clsx'
import { TransformedKanbanTask } from '../transformKanbanTasks'
import { $Any } from '@types'

interface KanBanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  task: TransformedKanbanTask & $Any
  isActive: boolean
  style: React.CSSProperties
  isOverlay: boolean
  isDragging: boolean
  inView: boolean
  isLoading: boolean
  index: number
}

const KanBanCard = forwardRef<HTMLDivElement, KanBanCardProps>(
  (
    {
      task,
      onClick,
      onKeyUp,
      isActive,
      style,
      isOverlay,
      isDragging,
      inView,
      index,
      isLoading,
      ...props
    },
    ref,
  ) => {
    if (!inView && inView !== undefined && !isLoading)
      return <div style={{ minHeight: 'var(--min-height)' }}></div>

    // get second last part of folder path
    const parent = task.folderPath?.split('/').slice(-3, -1)[0]

    return (
      <>
        <Styled.KanBanEntityCard
          ref={ref}
          id={task.id}
          header={task.folderLabel || task.folderName}
          path={!isOverlay && parent}
          project={task.projectCode}
          titleIcon={task.taskInfo?.icon}
          titleColor={task.taskInfo?.color}
          title={task.label || task.name}
          imageUrl={task.thumbnailUrl}
          imageIcon={task.taskInfo?.icon}
          isPlayable={task.hasReviewables}
          isLoading={isLoading}
          loadingSections={['header', 'title', 'users', 'status']}
          onClick={onClick}
          users={(!!task.assigneesData?.length && task.assigneesData) || null}
          status={task.statusInfo}
          priority={task.priorityInfo}
          isActive={isActive}
          style={{ width: 210, visibility: isDragging ? 'hidden' : 'visible', ...style }}
          onKeyUp={onKeyUp}
          className={clsx({ overlay: isOverlay }, props.className)}
          $index={index}
          isDraggable
          {...props}
        />
      </>
    )
  },
)

KanBanCard.displayName = 'KanBanCard'

export default KanBanCard
