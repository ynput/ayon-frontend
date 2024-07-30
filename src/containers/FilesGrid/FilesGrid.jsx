import * as Styled from './FilesGrid.styled'
import { classNames } from 'primereact/utils'
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
  ...props
}) => {
  if (!files.length) return null

  const handleExpand = (index) => () => {
    const filteredFiles = files.filter(file => isFilePreviewable(file.mime, file.ext))
    const updatedIndex = filteredFiles.findIndex(file => file.id === files[index].id)
    onExpand({ files: filteredFiles, index: updatedIndex, activityId: activityId })
  }

  return (
    <Styled.Grid className={classNames({ compact: isCompact })} {...props}>
      {files.map((file, index) => (
        <FileUploadCard
          key={index}
          id={file.id}
          name={file.name}
          mime={file.mime}
          size={file.size}
          src={`/api/projects/${projectName}/files/${file.id}`}
          progress={file.progress}
          onRemove={onRemove ? () => onRemove(file.id, file.name) : undefined}
          isCompact={isCompact}
          isDownloadable={isDownloadable}
          onExpand={handleExpand(index)}
        />
      ))}
    </Styled.Grid>
  )
}

export default FilesGrid
