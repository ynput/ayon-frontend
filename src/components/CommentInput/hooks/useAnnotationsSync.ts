import { FEED_NEW_COMMENT, useFeed } from '@context/FeedContext'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Annotation, goToFrame, removeAnnotation } from '@state/viewer'
import { useEffect } from 'react'

type Props = {
  entityId: string
  filesUploading: File[]
}

type AnnotationPreview = Annotation & {
  isAnnotation: true
}

// annotations are temporary store
export const filterEntityAnnotations = (
  annotations: Record<string, Annotation>,
  entityId: string,
  filesUploading: File[],
): AnnotationPreview[] => {
  return Object.values(annotations)
    .filter(
      (annotation) =>
        annotation.versionId === entityId &&
        !filesUploading.some((file) => file.name === annotation.name),
    )
    .map((annotation) => ({ ...annotation, isAnnotation: true })) as AnnotationPreview[]
}

const useAnnotationsSync = ({ entityId, filesUploading }: Props) => {
  const dispatch = useAppDispatch()
  const { editingId, setEditingId } = useFeed()
  // listen to the viewer for annotations
  const allAnnotations = useAppSelector((state) => state.viewer.annotations)
  // filter out annotations that are for this entity and are NOT uploading
  const annotations = filterEntityAnnotations(allAnnotations, entityId, filesUploading)

  // when annotations change, update the state
  // convert the base64 image to a file
  useEffect(() => {
    // open the comment input if there are annotations and something is not being edited already
    if (annotations.length > 0 && !editingId) {
      setEditingId(FEED_NEW_COMMENT)
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
