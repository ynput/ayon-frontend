import { FC } from 'react'
import * as Styled from './FolderBody.styled'
import clsx from 'clsx'

interface FolderBodyProps {
  name: string
  parents: string[]
  folderId: string
  folderIcon?: string | null
  isExpanded: boolean
  projectName: string
  isLoading: boolean
  onExpandToggle: () => void
}

export const FolderBody: FC<FolderBodyProps> = ({
  name,
  parents,
  folderId,
  folderIcon,
  isExpanded,
  projectName,
  isLoading,
  onExpandToggle,
}) => {
  const firstParent = parents[parents.length - 1]

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
      <Styled.Path>
        <span className="parent">{firstParent}</span>
        {firstParent && <span>/</span>}
        <span className="title">{name}</span>
      </Styled.Path>
    </Styled.Body>
  )
}
