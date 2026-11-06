import { memo, useState } from 'react'
import { CellContext } from '@tanstack/react-table'
import { Icon } from '@ynput/ayon-react-components'
import ProjectThumbnailUploader from '../ProjectThumbnailUploader/ProjectThumbnailUploader'
import { isEmptyFolderPlaceholderRow, ProjectTableRow } from '../../hooks/useProjectTableRows'
import { PROJECT_ICON } from '../../constants'

export const THUMBNAIL_WIDTH = 42
export const THUMBNAIL_HEIGHT = 24

interface ProjectThumbnailCellProps {
  info: CellContext<ProjectTableRow, string>
}

const ProjectThumbnailImage = ({
  projectName,
  updatedAt,
}: {
  projectName: string
  updatedAt?: string
}) => {
  // projects without a thumbnail get a 1px transparent image: show the project icon instead
  const [isEmpty, setIsEmpty] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: THUMBNAIL_WIDTH,
        height: '100%',
        flexShrink: 0,
      }}
    >
      <img
        src={
          updatedAt
            ? `/api/projects/${projectName}/thumbnail?updatedAt=${updatedAt}`
            : `/api/projects/${projectName}/thumbnail`
        }
        alt={`${projectName} thumbnail`}
        onLoad={(e) => setIsEmpty(e.currentTarget.naturalWidth <= 1)}
        onError={() => setIsEmpty(true)}
        style={{
          width: THUMBNAIL_WIDTH,
          height: THUMBNAIL_HEIGHT,
          position: 'relative',
          objectFit: 'cover',
          borderRadius: 'var(--border-radius-m)',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          flexShrink: 0,
        }}
      />
      {isEmpty && (
        <Icon
          icon={PROJECT_ICON}
          style={{
            position: 'absolute',
            fontSize: 16,
            color: 'var(--md-sys-color-outline)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

export const ProjectThumbnailCell = memo(({ info }: ProjectThumbnailCellProps) => {
  if (isEmptyFolderPlaceholderRow(info.row.original)) return null

  const projectName = info.getValue()
  const updatedAt = info.row.original.updatedAt

  return (
    <ProjectThumbnailUploader
      projectName={projectName}
      projectUpdatedAt={updatedAt}
      Thumbnail={ProjectThumbnailImage}
    />
  )
})

ProjectThumbnailCell.displayName = 'ProjectThumbnailCell'
