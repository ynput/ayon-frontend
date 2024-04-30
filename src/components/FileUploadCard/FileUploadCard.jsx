import { Button, Icon } from '@ynput/ayon-react-components'
import * as Styled from './FileUploadCard.styled'
import { classNames } from 'primereact/utils'
import { useState } from 'react'

const fileIcons = {
  // special cases
  doc: 'description',
  zip: 'folder_zip',
  json: 'code_blocks',
  javascript: 'code_blocks',
  html: 'code_blocks',
  css: 'code_blocks',
  pdf: 'picture_as_pdf',
  // default
  image: 'image',
  video: 'videocam',
  application: 'business_center',
  audio: 'audio_file',
  text: 'text_snippet',
  sequence: 'filter_none',
  font: 'font_download',
  model: '3d_rotation',
}

const getIconForType = (type) => {
  const icon = Object.entries(fileIcons).find(([key]) => type.includes(key))?.[1]
  if (icon) return icon
  return 'draft'
}

const FileUploadCard = ({ name, type, src, progress, onRemove, isCompact }) => {
  const inProgress = progress && progress < 100

  const [imageError, setImageError] = useState(false)

  return (
    <Styled.File className={classNames({ compact: isCompact })}>
      <Styled.ImageWrapper>
        <Icon icon={getIconForType(type)} />
        <img
          src={src}
          onError={() => setImageError(true)}
          style={{
            display: imageError ? 'none' : 'block',
          }}
        />
      </Styled.ImageWrapper>
      <footer className={classNames({ inProgress })}>
        <span className="progress" style={{ right: `${100 - progress}%` }} />
        <span className="name">{name}</span>
      </footer>
      {onRemove && <Button className="remove" onClick={onRemove} icon="close" />}
    </Styled.File>
  )
}

export default FileUploadCard
