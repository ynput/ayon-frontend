import { useDispatch, useSelector } from 'react-redux'
import * as Styled from './FileUploadPreview.styled'
import { onFilePreviewClose, onCommentImageIndexChange } from '@state/context'
import { useEffect, useRef } from 'react'
import ImageMime from './mimes/ImageMime'
import TextMime from './mimes/TextMime'
import { classNames } from 'primereact/utils'

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
  const files = useSelector((state) => state.context.previewFiles)
  const index = useSelector((state) => state.context.previewFilesIndex)
  const { id, projectName, mime, extension, name } = files[index] || {}

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
    callback(files[index])
    return null
  }

  const isImage = typeId === 'image'

  if (!MimeComponent) return null

  return (
    <Styled.DialogWrapper
      onKeyDown={(e) => {
        if (e.code == 'ArrowRight') {
          if (index + 1 == files.length) {
            return
          }
          dispatch(onCommentImageIndexChange({index : index + 1}))
        }
        if (e.code == 'ArrowLeft') {
          if (index == 0 ) {
            return
          }
          dispatch(onCommentImageIndexChange({index : index - 1}))
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
      <MimeComponent file={files[index]} />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
