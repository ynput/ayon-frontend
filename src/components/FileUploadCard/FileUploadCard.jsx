import { Button, getFileSizeString, Icon } from '@ynput/ayon-react-components'
import * as Styled from './FileUploadCard.styled'
import clsx from 'clsx'
import { useState } from 'react'
import { isFilePreviewable } from '@containers/FileUploadPreview/FileUploadPreview'

const fileIcons = {
  // special cases
  description: ['doc'],
  folder_zip: ['zip'],
  code_blocks: [
    'json',
    'javascript',
    'python',
    'html',
    'css',
    '.py',
    '.js',
    '.html',
    '.css',
    '.json',
    '.ts',
  ],
  brush: ['.psd', '.ai', '.xd', '.sketch'],
  '3d_rotation': [
    '.mb',
    '.ma',
    '.c4d',
    '.blend',
    '.max',
    '.3ds',
    '.lwo',
    '.lws',
    '.lxo',
    '.hip',
    '.hda',
  ],
  theaters: ['.aep', '.tpl', '.clip', '.nk', '.fusion', '.prproj', '.spsm', '.drp'],
  picture_as_pdf: ['pdf', '.pdf'],
  // default
  image: ['image', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
  videocam: ['video', '.mp4', '.mov', '.avi', '.mkv', '.webm', '.mxf'],
  business_center: ['application'],
  audio_file: ['audio'],
  text_snippet: ['text'],
  filter_none: ['sequence'],
  font_download: ['font'],
  deployed_code: ['model', '.obj', '.abc', '.stl', '.fbx', '.gltf', '.glb', '.usd'],
}

const getIconForType = (type) => {
  for (const [icon, keywords] of Object.entries(fileIcons)) {
    if (keywords.some((keyword) => type.includes(keyword))) {
      return icon
    }
  }
  return 'draft'
}


const FileUploadCard = ({
  name,
  mime,
  src,
  isAnnotation,
  size,
  progress,
  onRemove,
  isCompact,
  isDownloadable = false,
  onExpand,
}) => {
  const inProgress = progress && progress < 100

  const [imageError, setImageError] = useState(false)

  // split name and file extension
  const nameParts = name.split('.')
  const extension = nameParts.pop()
  const fileName = nameParts.join('.')

  const isPreviewable = isFilePreviewable(mime || '.' + extension)
  const isImage = mime?.includes('image/') || isAnnotation

  const downloadComponent = (
    <>
      <span className="size">{getFileSizeString(size)}</span>
      <Icon icon="download" className="download-icon" />
    </>
  )

  const handleImageClick = () => {
    if ((!isPreviewable && !isAnnotation) || !onExpand || imageError) return
    onExpand()
  }

  return (
    <Styled.File
      className={clsx({ compact: isCompact, isDownloadable, isPreviewable, isAnnotation })}
    >
      <Styled.ContentWrapper
        className={clsx('content-wrapper', { isPreviewable, isAnnotation })}
        onClick={handleImageClick}
      >
        <Icon icon={getIconForType(mime || '.' + extension)} className="type-icon" />
        {isImage && src && (
          <Styled.ImageWrapper
            className={clsx({ isDownloadable: isDownloadable || isPreviewable || isAnnotation })}
          >
            <img
              src={src}
              onError={() => setImageError(true)}
              style={{
                display: imageError ? 'none' : 'block',
              }}
            />
          </Styled.ImageWrapper>
        )}
        {isPreviewable && <Icon icon="open_in_full" className="expand-icon" />}
        {isAnnotation && <Icon icon="play_circle" className="expand-icon" />}
      </Styled.ContentWrapper>
      <Styled.Footer className={clsx({ inProgress, isPreviewable, isDownloadable })}>
        <span className="progress" style={{ right: `${100 - progress}%` }} />
        <div className="name-wrapper">
          <span className="name">{fileName}</span>
        </div>
        <span className="extension">.{extension}</span>
        {isDownloadable &&
          (!onRemove ? (
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
}

export default FileUploadCard
