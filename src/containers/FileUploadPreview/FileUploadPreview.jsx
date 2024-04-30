import { useDispatch, useSelector } from 'react-redux'
import * as Styled from './FileUploadPreview.styled'
import { onFilePreviewClose } from '/src/features/context'

const FileUploadPreview = () => {
  const dispatch = useDispatch()
  const file = useSelector((state) => state.context.previewFile)
  const { id, projectName } = file || {}

  const handleClose = () => {
    dispatch(onFilePreviewClose())
  }

  return (
    <Styled.DialogWrapper size="full" isOpen={id && projectName} onClose={handleClose}>
      <Styled.Image src={`/api/projects/${projectName}/files/${id}`} autoFocus />
    </Styled.DialogWrapper>
  )
}

export default FileUploadPreview
