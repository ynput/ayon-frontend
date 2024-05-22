import { useDispatch, useSelector } from 'react-redux'
import * as Styled from './FileUploadPreview.styled'
import { onFilePreviewClose } from '/src/features/context'
import { useEffect, useRef } from 'react'

const FileUploadPreview = () => {
  const dispatch = useDispatch()
  const file = useSelector((state) => state.context.previewFile)
  const { id, projectName } = file || {}

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

  return (
    <Styled.DialogWrapper
      size="full"
      isOpen={id && projectName}
      onClose={handleClose}
      hideCancelButton
      ref={dialogRef}
    >
      <Styled.Image src={`/api/projects/${projectName}/files/${id}`} autoFocus />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
