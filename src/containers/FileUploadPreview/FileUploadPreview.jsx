import { useDispatch, useSelector } from 'react-redux'
import * as Styled from './FileUploadPreview.styled'
import { onFilePreviewClose } from '/src/features/context'
import { useEffect, useRef } from 'react'

const fullPreviews = ['png', 'jpg', 'jpeg', 'gif', 'svg']

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

  let imgURL = `/api/projects/${projectName}/files/${id}`
  const useFullPreview = fullPreviews.some((ext) => mime.includes(ext))
  // if the file is NOT png, jpg, jpeg, gif, or svg, we use preview image
  if (!useFullPreview) imgURL += '?preview=true'

  return (
    <Styled.DialogWrapper
      size="full"
      isOpen={id && projectName}
      onClose={handleClose}
      hideCancelButton
      ref={dialogRef}
    >
      <Styled.Image src={imgURL} autoFocus />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
