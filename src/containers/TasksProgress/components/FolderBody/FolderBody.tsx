import { FC } from 'react'
import * as Styled from './FolderBody.styled'
import clsx from 'clsx'

interface FolderBodyProps {
  name: string
  folderId: string
  folderIcon?: string | null
  isExpanded: boolean
  projectName: string
  isLoading: boolean
  onExpandToggle: () => void
}

export const FolderBody: FC<FolderBodyProps> = ({
  name,
  folderId,
  folderIcon,
  isExpanded,
  projectName,
  isLoading,
  onExpandToggle,
}) => {
  return (
    <Styled.Body>
      <Styled.ExpandButton
        icon={isExpanded ? 'collapse_all' : 'expand_all'}
        variant="text"
        onClick={onExpandToggle}
      />
      <Styled.FolderThumbnail
        projectName={projectName}
        entityType={'folder'}
        entityId={folderId}
        icon={folderIcon}
        className={clsx({ loading: isLoading })}
        showBorder={false}
      />
      <span className="title">{name}</span>
    </Styled.Body>
  )
}
