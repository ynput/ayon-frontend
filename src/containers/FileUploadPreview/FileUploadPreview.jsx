import { useDispatch, useSelector } from 'react-redux'
import * as Styled from './FileUploadPreview.styled'
import { onFilePreviewClose } from '@state/context'
import { useEffect, useRef } from 'react'
import ImageMime from './mimes/ImageMime'
import TextMime from './mimes/TextMime'
import { classNames } from 'primereact/utils'
import { Icon } from '@ynput/ayon-react-components'
import useAttachmentNavigation from './hooks/useAttachmentNavigation'

// define expandable mime types and their components
export const expandableMimeTypes = {
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
    callback: (file) => window.open(getFileURL(file.id, file.projectName), '_blank'),
  },
}

export const isFilePreviewable = (mime = '', ext = '') =>
  Object.values(expandableMimeTypes).some(({ mimeTypes = [] }) =>
    mimeTypes.some((type) => (mime || ext)?.includes(type)),
  )

export const getFileURL = (id, projectName) => `/api/projects/${projectName}/files/${id}`

const FileUploadPreview = () => {
  const dispatch = useDispatch()
  const {
    previewFiles: files,
    previewFilesIndex: index,
    previewFilesActivityId: activityId,
    previewFilesProjectName: projectName,
  } = useSelector((state) => state.context)
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
  } = useAttachmentNavigation({ files, index, activityId })
  const file = { ...getByIndexActivity(activityId, index), projectName }
  const { id, mime, extension, name } = file

  // when dialog open, focus on the dialog
  // we do this so that the user can navigate with the keyboard (esc works)
  const dialogRef = useRef(null)
  useEffect(() => {
    if (id && projectName) {
      dialogRef.current?.focus()
    }
  }, [id, projectName])

  const handleClose = () => {
    dispatch(onFilePreviewClose())
  }

  if (!id || !projectName) return null

  // get the correct mime type component based on mimeTypes match
  const previewable = Object.values(expandableMimeTypes).find(({ mimeTypes }) =>
    mimeTypes.some((type) => (mime || extension)?.includes(type)),
  )

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

  if (!MimeComponent) return null

  return (
    <Styled.DialogWrapper
      onKeyDown={(e) => {
        if (e.code == 'ArrowUp') {
          handleNavigateToPrevActivity()
        }
        if (e.code == 'ArrowDown') {
          handleNavigateToNextActivity()
        }
        if (e.code == 'ArrowRight') {
          handleNavigateToNext()
        }
        if (e.code == 'ArrowLeft') {
          handleNavigateToPrevious()
        }
      }}
      size="full"
      isOpen={id && projectName}
      onClose={handleClose}
      hideCancelButton={isImage}
      ref={dialogRef}
      className={classNames({ isImage })}
      header={isImage ? null : name}
    >
      <Icon
        icon="chevron_left"
        className={classNames('navIcon', !canNavigateLeft() ? 'disabled' : undefined)}
        onClick={handleNavigateToPrevious}
      />
      <div>
        <MimeComponent file={file} />
      </div>
      <Icon
        icon="chevron_right"
        className={classNames('navIcon', !canNavigateRight() ? 'disabled' : undefined)}
        onClick={handleNavigateToNext}
      />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
