import { Button, getFileSizeString, Icon } from '@ynput/ayon-react-components'
import * as Styled from './FileUploadCard.styled'
import clsx from 'clsx'
import { useState } from 'react'
import { isFilePreviewable } from '../FileUploadPreview'
import { SavedAnnotationMetadata } from '@shared/containers'
import { useDetailsPanelContext } from '@shared/context'
import { AnnotationPreview } from '../CommentInput/hooks/useAnnotationsSync'

export interface FileUploadCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  mime?: string
  src?: string
  unsavedAnnotation?: AnnotationPreview
  savedAnnotation?: SavedAnnotationMetadata
  size: number
  progress: number
  onRemove?: () => void
  isCompact?: boolean
  isDownloadable?: boolean
  onExpand?: () => void
  disableExpand?: boolean
  onJumpTo?: () => void
}

const fileIcons: { [key: string]: string[] } = {
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

const getIconForType = (type: string): string => {
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
  unsavedAnnotation,
  savedAnnotation,
  size,
  progress,
  onRemove,
  isCompact,
  isDownloadable = false,
  onExpand,
  disableExpand,
  onJumpTo,
  className,
  ...props
}: FileUploadCardProps) => {
  const inProgress = progress && progress < 100

  const [imageError, setImageError] = useState(false)
  const { feedAnnotationsEnabled } = useDetailsPanelContext()

  // split name and file extension
  const nameParts = name.split('.')
  const extension = nameParts.pop() || ''
  const fileName = nameParts.join('.')

  const isPreviewable = isFilePreviewable(mime || '.' + extension)
  const isImage = mime?.includes('image/') || Boolean(unsavedAnnotation)

  const downloadComponent = (
    <>
      <span className="size">{getFileSizeString(size)}</span>
      <Icon icon="download" className="download-icon" />
    </>
  )

  const someAnnotation = unsavedAnnotation ?? savedAnnotation

  return (
    <Styled.File
      className={clsx(className, {
        compact: isCompact,
        isDownloadable,
        isPreviewable,
        isUnsavedAnnotation: Boolean(unsavedAnnotation),
      })}
      {...props}
    >
      <Styled.ContentWrapper
        className={clsx('content-wrapper', {
          isPreviewable,
          isUnsavedAnnotation: Boolean(unsavedAnnotation),
        })}
      >
        <Icon icon={getIconForType(mime || '.' + extension)} className="type-icon" />
        {isImage && src && (
          <Styled.ImageWrapper
            className={clsx({
              'image-wrapper': true,
              isDownloadable: isDownloadable || isPreviewable || unsavedAnnotation,
            })}
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
        <Styled.Buttons className="expand-buttons">
          {isPreviewable && !disableExpand && (
            <Styled.ExpandButton
              data-tooltip="Open preview"
              icon="open_in_full"
              variant="nav"
              onClick={onExpand}
            />
          )}
          {(unsavedAnnotation || (feedAnnotationsEnabled && savedAnnotation)) && (
            <Styled.ExpandButton
              data-tooltip="Jump to annotation"
              icon="play_circle"
              variant="nav"
              onClick={onJumpTo}
            />
          )}
        </Styled.Buttons>
      </Styled.ContentWrapper>
      <Styled.Footer
        className={clsx({
          inProgress,
          isPreviewable: isPreviewable && !disableExpand,
          isDownloadable,
        })}
      >
        <span className="progress" style={{ right: `${100 - progress}%` }} />
        <div className="name-wrapper">
          {someAnnotation ? (
            <span className="name">
              <Icon icon="draw" />
              {someAnnotation.range[0]}
              {someAnnotation.range[1] !== someAnnotation.range[0] &&
                ` - ${someAnnotation.range[1]}`}
            </span>
          ) : (
            <span className="name">
              {fileName}
              <span className="extension">.{extension}</span>
            </span>
          )}
        </div>

        {isDownloadable &&
          (!onRemove ? (
            <a href={src} target="_blank" rel="noopener noreferrer" className="download">
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
