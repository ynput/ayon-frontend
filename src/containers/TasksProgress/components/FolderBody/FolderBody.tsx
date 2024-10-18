import { FC } from 'react'
import * as Styled from './FolderBody.styled'
import clsx from 'clsx'

interface FolderBodyProps {
  name: string
  folderId: string
  folderIcon?: string | null
  isExpanded: boolean
  projectName: string
  onExpandToggle: () => void
}

export const FolderBody: FC<FolderBodyProps> = ({
  name,
  folderId,
  folderIcon,
  isExpanded,
  projectName,
  onExpandToggle,
}) => {
  return (
    <Styled.Body className={clsx({ expanded: isExpanded })}>
      <Styled.ExpandButton
        icon={isExpanded ? 'collapse_all' : 'expand_all'}
        variant="text"
        onClick={onExpandToggle}
      />
      <Styled.ThumbnailCard className={clsx({ expanded: isExpanded })}>
        <Styled.FolderThumbnail
          projectName={projectName}
          entityType={'folder'}
          entityId={folderId}
          icon={folderIcon}
          showBorder={false}
        />
        <Styled.ThumbnailShotName className={clsx({ expanded: isExpanded })}>
          {name}
        </Styled.ThumbnailShotName>
      </Styled.ThumbnailCard>
      <Styled.Path>
        <span className="title">{name}</span>
      </Styled.Path>
    </Styled.Body>
  )
}
