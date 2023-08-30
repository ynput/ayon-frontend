import { forwardRef, useState } from 'react'
import * as Styled from './KanBanCard.styled'
import useCreateContext from '/src/hooks/useCreateContext'
import copyToClipboard from '/src/helpers/copyToClipboard'
import { Dialog } from 'primereact/dialog'

const KanBanCard = forwardRef(
  ({ task, onClick, onKeyUp, isActive, style, isOverlay, isDragging, ...props }, ref) => {
    const [dialogOpen, setDialogOpen] = useState(false)

    const contextMenuItems = [
      {
        label: 'View task detail',
        command: () => setDialogOpen(true),
        icon: 'visibility',
      },
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
    ]
    const [showContextMenu] = useCreateContext(contextMenuItems)

    return (
      <>
        <Dialog visible={dialogOpen} onHide={() => setDialogOpen(false)} style={{ width: '50vw' }}>
          <pre>{JSON.stringify(task, null, 2)}</pre>
        </Dialog>
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
          {...props}
        />
      </>
    )
  },
)

KanBanCard.displayName = 'KanBanCard'

export default KanBanCard
