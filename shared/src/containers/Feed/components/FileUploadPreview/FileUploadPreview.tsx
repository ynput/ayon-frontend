import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import useAttachmentNavigation from './hooks/useAttachmentNavigation'
import * as Styled from './FileUploadPreview.styled'
import { expandableMimeTypes } from './FileUploadPreviewHelpers'

export type MimeTypeDefinition = {
  component: React.FC<any> | null
  mimeTypes: string[]
  fullPreviews?: string[]
  id: string
  callback?: (file: any) => void
}

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
  } = useAttachmentNavigation({ files, index, activityId, onNavigate })
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

  // get the correct mime type component based on mimeTypes match
  const previewable = Object.values(expandableMimeTypes).find(({ mimeTypes }) =>
    mimeTypes.some((type) => (mime || extension)?.includes(type)),
  )

  // @ts-ignore
  const { component: MimeComponent, id: typeId, callback, fullPreviews } = previewable || {}

  // ayon-player binds its own document keydown listener for frame stepping, so claim the arrow
  // keys in the capture phase — otherwise each press would navigate and seek at the same time
  useEffect(() => {
    // callback mimes (pdf) never render the dialog, so a global listener would outlive it
    if (!id || !projectName || !MimeComponent || callback) return

    const navigation: { [key: string]: [() => boolean, () => void] } = {
      ArrowUp: [canNavigateUp, navigateUp],
      ArrowDown: [canNavigateDown, navigateDown],
      ArrowLeft: [canNavigateLeft, navigateLeft],
      ArrowRight: [canNavigateRight, navigateRight],
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleClose()
        return
      }

      const move = navigation[e.code]
      if (!move) return

      if (e.target instanceof HTMLElement) {
        const { tagName, isContentEditable } = e.target
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable) return
      }

      e.preventDefault()
      e.stopPropagation()
      const [canNavigate, navigate] = move
      if (canNavigate()) navigate()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [id, projectName, files, index, activityId, MimeComponent, callback])

  if (!id || !projectName) return null

  // if there is a callback, run it and return null
  // mainly for pdfs
  if (callback) {
    callback(file)
    return null
  }

  const handleNavigateToPrevious = () => canNavigateLeft() && navigateLeft()
  const handleNavigateToNext = () => canNavigateRight() && navigateRight()

  const isImage = typeId === 'image'
  const isVideo = typeId === 'video'
  const zIndex = 50

  if (!MimeComponent) {
    return null
  }

  return (
    <Styled.DialogWrapper
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

      <Styled.ScrollableContent
        style={{ zIndex: zIndex + 1 }}
        className={clsx({ scrollable: !isImage && !isVideo, fill: isVideo })}
      >
        <MimeComponent file={file} fullPreviews={fullPreviews} />
      </Styled.ScrollableContent>

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
