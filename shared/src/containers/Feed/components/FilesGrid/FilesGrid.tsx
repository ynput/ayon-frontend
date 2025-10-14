import * as Styled from './FilesGrid.styled'
import clsx from 'clsx'
import FileUploadCard, { FileUploadCardProps } from '../FileUploadCard'
import { isFilePreviewable } from '../FileUploadPreview'
import { useCallback } from 'react'

export interface FilesGridProps extends React.HTMLAttributes<HTMLDivElement> {
  files?: any[]
  activityId?: string
  isCompact?: boolean
  isEditing?: boolean
  onRemove?: (id: string, name: string, isUnsavedAnnotation: boolean) => void
  projectName: string
  isDownloadable?: boolean
  onExpand?: (data: { files: any[]; index: number; activityId: string }) => void
  onAnnotationClick?: (file: any) => void
  pt?: {
    file?: Partial<FileUploadCardProps>
  }
}

const FilesGrid: React.FC<FilesGridProps> = ({
  files = [],
  activityId,
  isCompact,
  isEditing,
  onRemove,
  projectName,
  isDownloadable,
  onExpand,
  onAnnotationClick,
  pt,
  ...props
}) => {
  if (!files.length) return null

  const handleExpand = useCallback(
    (index: number) => {
      const filteredFiles = files.filter((file) => isFilePreviewable(file.mime, file.ext))
      const updatedIndex = filteredFiles.findIndex((file) => file.id === files[index].id)
      onExpand?.({ files: filteredFiles, index: updatedIndex, activityId: activityId || '' })
    },
    [onExpand],
  )

  return (
    <Styled.Grid className={clsx({ compact: isCompact })} {...props}>
      {files.map((file, index) => (
        <FileUploadCard
          key={index}
          id={file.id || file.name}
          name={file.name}
          mime={file.mime || file.type}
          size={file.size}
          src={
            file.unsavedAnnotation
              ? file.thumbnail
              : `/api/projects/${projectName}/files/${file.id}`
          }
          unsavedAnnotation={file.unsavedAnnotation}
          savedAnnotation={file.annotation}
          progress={file.progress}
          onRemove={
            onRemove ? () => onRemove(file.id, file.name, !!file.unsavedAnnotation) : undefined
          }
          isCompact={isCompact}
          isDownloadable={isDownloadable}
          onExpand={() => handleExpand(index)}
          onJumpTo={() => onAnnotationClick?.(file)}
          disableExpand={isEditing}
          {...pt?.file}
        />
      ))}
    </Styled.Grid>
  )
}

export default FilesGrid
