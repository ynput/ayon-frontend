import * as Styled from './FilesGrid.styled'
import clsx from 'clsx'
import FileUploadCard from '@components/FileUploadCard/FileUploadCard'
import { isFilePreviewable } from '@containers/FileUploadPreview/FileUploadPreview'

const FilesGrid = ({
  files = [],
  activityId,
  isCompact,
  onRemove,
  projectName,
  isDownloadable,
  onExpand,
  onAnnotationClick,
  ...props
}) => {
  if (!files.length) return null

  const handleExpand = (file, index) => {
    if (file.isAnnotation) {
      onAnnotationClick?.(file)
    } else {
      const filteredFiles = files.filter((file) => isFilePreviewable(file.mime, file.ext))
      const updatedIndex = filteredFiles.findIndex((file) => file.id === files[index].id)
      onExpand({ files: filteredFiles, index: updatedIndex, activityId: activityId })
    }
  }

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
            file.isAnnotation ? file.thumbnail : `/api/projects/${projectName}/files/${file.id}`
          }
          isAnnotation={file.isAnnotation}
          progress={file.progress}
          onRemove={onRemove ? () => onRemove(file.id, file.name, file.isAnnotation) : undefined}
          isCompact={isCompact}
          isDownloadable={isDownloadable}
          onExpand={() => handleExpand(file, index)}
        />
      ))}
    </Styled.Grid>
  )
}

export default FilesGrid
