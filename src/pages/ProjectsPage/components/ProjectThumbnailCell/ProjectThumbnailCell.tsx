import { memo } from 'react'
import { CellContext } from '@tanstack/react-table'
import ProjectThumbnailUploader from '../ProjectThumbnailUploader/ProjectThumbnailUploader'
import { isEmptyFolderPlaceholderRow, ProjectTableRow } from '../../hooks/useProjectTableRows'

export const THUMBNAIL_WIDTH = 42
export const THUMBNAIL_HEIGHT = 24

interface ProjectThumbnailCellProps {
  info: CellContext<ProjectTableRow, string>
}

export const ProjectThumbnailCell = memo(({ info }: ProjectThumbnailCellProps) => {
  if (isEmptyFolderPlaceholderRow(info.row.original)) return null

  const projectName = info.getValue()
  const updatedAt = info.row.original.updatedAt

  return (
    <ProjectThumbnailUploader
      projectName={projectName}
      projectUpdatedAt={updatedAt}
      Thumbnail={({ projectName, updatedAt }) => (
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
          {/* projects without a thumbnail get a transparent image: the background is an empty tile */}
          <img
            src={
              updatedAt
                ? `/api/projects/${projectName}/thumbnail?updatedAt=${updatedAt}`
                : `/api/projects/${projectName}/thumbnail`
            }
            alt={`${projectName} thumbnail`}
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
        </div>
      )}
    />
  )
})

ProjectThumbnailCell.displayName = 'ProjectThumbnailCell'
