import { useEffect, useRef } from 'react'
import ImageMime from './Mimes/ImageMime'
import TextMime from './Mimes/TextMime'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import useAttachmentNavigation from './hooks/useAttachmentNavigation'
import * as Styled from './FileUploadPreview.styled'

export type MimeTypeDefinition = {
  component: React.FC<any> | null
  mimeTypes: string[]
  fullPreviews?: string[]
  id: string
  callback?: (file: any) => void
}

// define expandable mime types and their components
export const expandableMimeTypes: { [key: string]: MimeTypeDefinition } = {
  image: {
    component: ImageMime,
    mimeTypes: ['image/'],
    fullPreviews: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
    id: 'image',
  },
  text: {
    component: TextMime,
    mimeTypes: ['text/', 'application/json', 'scss', 'jsx'],
    id: 'text',
  },
  pdf: {
    component: null,
    mimeTypes: ['pdf'],
    id: 'pdf',
    callback: (file: any) => window.open(getFileURL(file.id, file.projectName), '_blank'),
  },
}

export const isFilePreviewable = (mime = '', ext = '') =>
  Object.values(expandableMimeTypes).some(({ mimeTypes = [] }) =>
    mimeTypes.some((type) => (mime || ext)?.includes(type)),
  )

export const getFileURL = (id: string, projectName: string) =>
  `/api/projects/${projectName}/files/${id}`

interface FileUploadPreviewProps {
  files: any[] // replace with correct type
  index: number
  activityId: string
  projectName: string
  onFilePreviewClose: () => void
  onNavigate: (payload: any) => void // replace with correct type
}

const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({
  files,
  index,
  activityId,
  projectName,
  onFilePreviewClose,
  onNavigate,
}) => {
  const {
    canNavigateDown,
    canNavigateUp,
    canNavigateLeft,
    canNavigateRight,
    getByIndexActivity,
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    // @ts-expect-error
  } = useAttachmentNavigation({ files, index, activityId })
  const file = { ...getByIndexActivity(activityId, index), projectName }
  const { id, mime, extension, name } = file

  // when dialog open, focus on the dialog
  // we do this so that the user can navigate with the keyboard (esc works)
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (id && projectName) {
      dialogRef.current?.focus()
    }
  }, [id, projectName])

  const handleClose = () => {
    onFilePreviewClose()
  }

  if (!id || !projectName) return null

  // get the correct mime type component based on mimeTypes match
  const previewable = Object.values(expandableMimeTypes).find(({ mimeTypes }) =>
    mimeTypes.some((type) => (mime || extension)?.includes(type)),
  )

  // @ts-ignore
  const { component: MimeComponent, id: typeId, callback } = previewable || {}

  // if there is a callback, run it and return null
  // mainly for pdfs
  if (callback) {
    callback(file)
    return null
  }

  const handleNavigateToPrevActivity = () => canNavigateUp() && navigateUp()
  const handleNavigateToNextActivity = () => canNavigateDown() && navigateDown()
  const handleNavigateToPrevious = () => canNavigateLeft() && navigateLeft()
  const handleNavigateToNext = () => canNavigateRight() && navigateRight()

  const isImage = typeId === 'image'
  const zIndex = 50

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'ArrowUp') {
      handleNavigateToPrevActivity()
    }
    if (e.code === 'ArrowDown') {
      handleNavigateToNextActivity()
    }
    if (e.code === 'ArrowRight') {
      handleNavigateToNext()
    }
    if (e.code === 'ArrowLeft') {
      handleNavigateToPrevious()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }

  if (!MimeComponent) {
    return null
  }

  return (
    <Styled.DialogWrapper
      onKeyDown={handleKeyDown}
      size="full"
      isOpen={!!(id && projectName)}
      onClose={handleClose}
      hideCancelButton={isImage}
      ref={dialogRef}
      className={clsx({ isImage }, 'block-shortcuts')}
      header={isImage ? null : name}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: zIndex }} onClick={handleClose}></div>

      <Icon
        style={{ zIndex: zIndex + 1 }}
        icon="chevron_left"
        className={clsx('navIcon', 'left', { disabled: !canNavigateLeft() })}
        onClick={handleNavigateToPrevious}
      />

      <div style={{ zIndex: zIndex + 1 }}>
        <MimeComponent file={file} />
      </div>

      <Icon
        style={{ zIndex: zIndex + 1 }}
        icon="chevron_right"
        className={clsx('navIcon', 'right', { disabled: !canNavigateRight() })}
        onClick={handleNavigateToNext}
      />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
