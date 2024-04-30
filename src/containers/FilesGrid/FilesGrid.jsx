import * as Styled from './FilesGrid.styled'
import { classNames } from 'primereact/utils'
import FileUploadCard from '/src/components/FileUploadCard/FileUploadCard'

const FilesGrid = ({ files = [], isCompact, onRemove, projectName, isDownloadable, ...props }) => {
  if (!files.length) return null

  return (
    <Styled.Grid className={classNames({ compact: isCompact })} {...props}>
      {files.map((file, index) => (
        <FileUploadCard
          key={index}
          name={file.name}
          mime={file.mime}
          size={file.size}
          src={`/api/projects/${projectName}/files/${file.id}`}
          progress={file.progress}
          onRemove={onRemove ? () => onRemove(file.id, file.name) : undefined}
          isCompact={isCompact}
          isDownloadable={isDownloadable}
        />
      ))}
    </Styled.Grid>
  )
}

export default FilesGrid
