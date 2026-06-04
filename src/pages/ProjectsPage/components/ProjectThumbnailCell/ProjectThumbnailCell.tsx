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

  const projectName = info.row.original.name
  const updatedAt = info.row.original.updatedAt

  return (
    <ProjectThumbnailUploader
      projectName={projectName}
      projectUpdatedAt={updatedAt}
      Thumbnail={({ projectName, updatedAt }) => (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
              objectFit: 'cover',
              borderRadius: 'var(--border-radius-m)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              flexShrink: 0,
            }}
          />
        </div>
      )}
    />
  )
})

ProjectThumbnailCell.displayName = 'ProjectThumbnailCell'
