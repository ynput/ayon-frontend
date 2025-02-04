import { useAppDispatch, useAppSelector } from '@state/store'
import { Annotation, goToFrame, removeAnnotation } from '@state/viewer'
import { useEffect } from 'react'

type Props = {
  openCommentInput: () => void
  entityId: string
  filesUploading: File[]
}

type AnnotationPreview = Annotation & {
  isAnnotation: true
}

// annotations are temporary store
const useAnnotationsSync = ({ openCommentInput, entityId, filesUploading }: Props) => {
  const dispatch = useAppDispatch()
  // listen to the viewer for annotations
  const allAnnotations = useAppSelector((state) => state.viewer.annotations)
  // filter out annotations that are for this entity and are NOT uploading
  const annotations = Object.values(allAnnotations)
    .filter(
      (annotation) =>
        annotation.versionId === entityId &&
        !filesUploading.some((file) => file.name === annotation.name),
    )
    .map((annotation) => ({ ...annotation, isAnnotation: true })) as AnnotationPreview[]

  // when annotations change, update the state
  // convert the base64 image to a file
  useEffect(() => {
    // open the comment input if there are annotations
    if (annotations.length > 0) {
      openCommentInput()
    }
  }, [annotations])

  const handleRemoveAnnotation = (id: string) => {
    dispatch(removeAnnotation(id))
  }

  const handleGoToAnnotation = (annotation: AnnotationPreview) => {
    const firstFrame = annotation.range[0]
    dispatch(goToFrame(firstFrame - 1))
  }

  return {
    annotations,
    removeAnnotation: handleRemoveAnnotation,
    goToAnnotation: handleGoToAnnotation,
  }
}

export default useAnnotationsSync
