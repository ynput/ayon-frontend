import * as Styled from './FilesGrid.styled'
import { classNames } from 'primereact/utils'
import FileUploadCard from '@components/FileUploadCard/FileUploadCard'

const FilesGrid = ({
  files = [],
  isCompact,
  onRemove,
  projectName,
  isDownloadable,
  onExpand,
  ...props
}) => {
  if (!files.length) return null

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
          onExpand={onExpand}
        />
      ))}
    </Styled.Grid>
  )
}

export default FilesGrid
