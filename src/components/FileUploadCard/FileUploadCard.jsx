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
  const icon = Object.entries(fileIcons).find(([key]) => type?.includes(key))?.[1]
  if (icon) return icon
  return 'draft'
}

const getFileSizeString = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Byte'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`
}

const FileUploadCard = ({
  name,
  mime,
  src,
  size,
  progress,
  onRemove,
  isCompact,
  isDownloadable = false,
}) => {
  const inProgress = progress && progress < 100

  const [imageError, setImageError] = useState(false)

  // split name and file extension
  const nameParts = name.split('.')
  const extension = nameParts.pop()
  const fileName = nameParts.join('.')

  const isImage = mime?.includes('image')

  const downloadComponent = (
    <>
      <span className="size">{getFileSizeString(size)}</span>
      <Icon icon="download" className="download-icon" />
    </>
  )

  const fileComponent = (
    <Styled.File className={classNames({ compact: isCompact, isDownloadable, isImage })}>
      <Styled.ImageWrapper
        className="image-wrapper"
        as={isImage && src ? 'a' : 'div'}
        href={isImage && src ? src : undefined}
        target="_blank"
        rel="noreferrer"
      >
        <Icon icon={getIconForType(mime)} className="type-icon" />
        <Icon icon="download" className="download-icon" />
        {isImage && src && (
          <img
            src={src + '?preview=true'}
            onError={() => setImageError(true)}
            style={{
              display: imageError ? 'none' : 'block',
            }}
          />
        )}
      </Styled.ImageWrapper>
      <Styled.Footer className={classNames({ inProgress })}>
        <span className="progress" style={{ right: `${100 - progress}%` }} />
        <div className="name-wrapper">
          <span className="name">{fileName}</span>
        </div>
        <span className="extension">.{extension}</span>
        {isDownloadable &&
          (isImage && !onRemove ? (
            <a href={src} download className="download">
              {downloadComponent}
            </a>
          ) : (
            <div className="download">{downloadComponent}</div>
          ))}
      </Styled.Footer>
      {onRemove && <Button className="remove" onClick={onRemove} icon="close" />}
    </Styled.File>
  )

  // if the file is an image, return the file component
  if (isImage || onRemove) return fileComponent
  // if it's not then we wrap with a direct link to download the file
  else
    return (
      <a href={src} download>
        {fileComponent}
      </a>
    )
}

export default FileUploadCard
