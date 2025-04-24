import { FC } from 'react'
import * as Styled from './FolderBody.styled'
import clsx from 'clsx'
import { EntityCard } from '@ynput/ayon-react-components'
import { getEntityTypeIcon } from '@shared/util'
import { Status } from '@api/rest/project'

interface FolderBodyProps {
  folder: {
    id: string
    name: string
    icon?: string | null
    status?: Status
    updatedAt: string
  }
  isSelected: boolean
  isExpanded: boolean
  projectName: string
  onExpandToggle: () => void
  onFolderOpen?: (id: string) => void
  onSpaceKey?: () => void
}

export const FolderBody: FC<FolderBodyProps> = ({
  folder,
  isSelected,
  isExpanded,
  projectName,
  onExpandToggle,
  onFolderOpen,
  onSpaceKey,
}) => {
  const thumbnailUrl = `/api/projects/${projectName}/folders/${folder.id}/thumbnail?updatedAt=${folder.updatedAt}`

  // handle hitting enter or space on the cell
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ') {
      e.preventDefault()
      onSpaceKey?.()
    }
  }

  return (
    <Styled.Body className={clsx({ expanded: isExpanded })} onKeyDown={handleKeyDown}>
      <Styled.ExpandButton
        icon={isExpanded ? 'collapse_all' : 'expand_all'}
        variant="text"
        onClick={onExpandToggle}
        className={clsx({ expanded: isExpanded })}
      />

      <Styled.ContentContainer>
        {folder.status && <Styled.Status size="icon" status={folder.status} />}
        <Styled.ContentWrapper className={clsx({ expanded: isExpanded })}>
          <EntityCard
            title={folder.name}
            titleIcon={folder.icon ?? getEntityTypeIcon('folder')}
            imageUrl={thumbnailUrl}
            imageIcon={folder.icon ?? getEntityTypeIcon('folder')}
            status={folder.status}
            onClick={() => onFolderOpen?.(folder.id)}
            isActive={isSelected}
          />
        </Styled.ContentWrapper>
        <Styled.ThumbnailCard className={clsx({ expanded: isExpanded })}>
          <Styled.FolderThumbnail
            entityId={folder.id}
            entityType="folder"
            projectName={projectName}
            entityUpdatedAt={folder.updatedAt}
            icon={folder.icon}
            showBorder={false}
            src={thumbnailUrl}
            hoverIcon="expand_all"
            onClick={() => !isExpanded && onExpandToggle()}
          />
        </Styled.ThumbnailCard>
        <Styled.Path
          onClick={() => onFolderOpen?.(folder.id)}
          className={clsx({ selected: isSelected })}
        >
          <span className="small-title">{folder.name}</span>
        </Styled.Path>
      </Styled.ContentContainer>
    </Styled.Body>
  )
}
