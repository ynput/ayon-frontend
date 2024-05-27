import { useDispatch, useSelector } from 'react-redux'
import * as Styled from './FileUploadPreview.styled'
import { onFilePreviewClose } from '/src/features/context'
import { useEffect, useRef } from 'react'
import ImageMime from './mimes/ImageMime'

export const expandableMimeTypes = {
  image: {
    component: ImageMime,
    mimeTypes: ['image/'],
    fullPreviews: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  },
}

export const isFilePreviewable = (mime) =>
  Object.values(expandableMimeTypes).some(({ mimeTypes }) =>
    mimeTypes.some((type) => mime.includes(type)),
  )

export const getFileURL = (id, projectName) => `/api/projects/${projectName}/files/${id}`

const FileUploadPreview = () => {
  const dispatch = useDispatch()
  const file = useSelector((state) => state.context.previewFile)
  const { id, projectName, mime } = file || {}

  // when dialog open, focus on the dialog
  // we do this so that the user can navigate with the keyboard (esc works)
  const dialogRef = useRef(null)
  useEffect(() => {
    if (id && projectName) {
      dialogRef.current.focus()
    }
  }, [id, projectName])

  const handleClose = () => {
    dispatch(onFilePreviewClose())
  }

  if (!id || !projectName) return null

  // get the correct mime type component based on mimeTypes match
  const { component: MimeComponent } = Object.values(expandableMimeTypes).find(({ mimeTypes }) =>
    mimeTypes.some((type) => mime.includes(type)),
  )

  if (!MimeComponent) return null

  return (
    <Styled.DialogWrapper
      size="full"
      isOpen={id && projectName}
      onClose={handleClose}
      hideCancelButton
      ref={dialogRef}
    >
      <MimeComponent file={file} />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
