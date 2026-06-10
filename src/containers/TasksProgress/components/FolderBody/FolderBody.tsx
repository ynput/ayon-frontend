import { FC } from 'react'
import * as Styled from './FolderBody.styled'
import clsx from 'clsx'
import { EntityCard } from '@ynput/ayon-react-components'
import { getEntityTypeIcon, getEntityThumbnailUrl } from '@shared/util'
import type { Status } from '@shared/api'
import { useProjectContext } from '@shared/context'

interface FolderBodyProps {
  folder: {
    id: string
    name: string
    folderType?: string
    status?: Status
    updatedAt: string
    thumbnailHash?: string
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
  const { folderTypes } = useProjectContext()
  const folderTypeData = folderTypes?.find((ft) => ft.name === folder.folderType)
  const icon = folderTypeData?.icon ?? getEntityTypeIcon('folder')
  const color = folderTypeData?.color

  const thumbnailUrl = getEntityThumbnailUrl({
    projectName,
    entityType: 'folder',
    entityId: folder.id,
    thumbnailHash: folder.thumbnailHash,
  })
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
            titleIcon={icon}
            titleColor={color}
            imageUrl={thumbnailUrl ?? undefined}
            imageIcon={icon}
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
            thumbnailHash={folder.thumbnailHash}
            icon={icon}
            color={color}
            showBorder={false}
            src={thumbnailUrl ?? undefined}
            hoverIcon="expand_all"
            onClick={() => !isExpanded && onExpandToggle()}
          />
        </Styled.ThumbnailCard>
        <Styled.Path
          onClick={() => onFolderOpen?.(folder.id)}
          className={clsx({ selected: isSelected, expanded: isExpanded })}
        >
          <span className="small-title">{folder.name}</span>
        </Styled.Path>
      </Styled.ContentContainer>
    </Styled.Body>
  )
}
