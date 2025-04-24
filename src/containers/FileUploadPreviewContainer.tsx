import {
  onFilePreviewClose,
  onCommentImageActivityAndIndexChange,
  onCommentImageIndexChange,
} from '@state/context'

import { FileUploadPreview } from '@shared/containers/Feed'
import { useAppDispatch, useAppSelector } from '@state/store'

const FileUploadPreviewContainer = () => {
  const dispatch = useAppDispatch()
  const {
    previewFiles: files,
    previewFilesIndex: index,
    previewFilesActivityId: activityId,
    previewFilesProjectName: projectName,
  } = useAppSelector((state) => state.context)

  const onNavigate = (payload: any) => {
    if (payload.delta !== undefined) {
      dispatch(onCommentImageIndexChange({ delta: payload.delta }))
    } else {
      dispatch(
        onCommentImageActivityAndIndexChange({
          activityId: payload.activityId,
          index: payload.index,
        }),
      )
    }
  }

  const handleClose = () => {
    dispatch(onFilePreviewClose())
  }

  return (
    <FileUploadPreview
      files={files}
      index={index as unknown as number}
      activityId={activityId as unknown as string}
      projectName={projectName}
      onFilePreviewClose={handleClose}
      onNavigate={onNavigate}
    />
  )
}

export default FileUploadPreviewContainer
