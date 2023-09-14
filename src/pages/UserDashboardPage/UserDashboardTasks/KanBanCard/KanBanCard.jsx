import { forwardRef, useMemo } from 'react'
import * as Styled from './KanBanCard.styled'
import useCreateContext from '/src/hooks/useCreateContext'
import copyToClipboard from '/src/helpers/copyToClipboard'

const KanBanCard = forwardRef(
  (
    { task, onClick, onKeyUp, isActive, style, isOverlay, isDragging, assigneesIsMe, ...props },
    ref,
  ) => {
    const contextMenuItems = useMemo(
      () => [
        {
          label: 'Copy task ID',
          command: () => copyToClipboard(task.id),
          icon: 'content_copy',
        },
        {
          label: 'Copy latest version ID',
          command: () => copyToClipboard(task.latestVersionId),
          icon: 'content_copy',
          disabled: !task.latestVersionId,
        },
      ],
      [task.id, task.latestVersionId],
    )

    const [showContextMenu] = useCreateContext(contextMenuItems)

    return (
      <>
        <Styled.KanBanEntityCard
          ref={ref}
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
          onContextMenu={showContextMenu}
          assignees={(!assigneesIsMe && !!task.assigneesData?.length && task.assigneesData) || []}
          {...props}
        />
      </>
    )
  },
)

KanBanCard.displayName = 'KanBanCard'

export default KanBanCard
