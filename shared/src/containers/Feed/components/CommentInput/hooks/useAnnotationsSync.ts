import { useEffect } from 'react'
import { FEED_NEW_COMMENT, useFeedContext } from '../../../context/FeedContext'

type Props = {
  entityId: string
  filesUploading: File[]
}

export type AnnotationPreview = any & {
  isAnnotation: true
}

// annotations are temporary store
export const filterEntityAnnotations = (
  annotations: Record<string, any>,
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
  const { editingId, setEditingId, annotations, removeAnnotation, onGoToFrame } = useFeedContext()

  // filter out annotations that are for this entity and are NOT uploading
  const filteredAnnotations = filterEntityAnnotations(annotations || [], entityId, filesUploading)

  // when annotations change, update the state
  useEffect(() => {
    // open the comment input if there are annotations and something is not being edited already
    if (filteredAnnotations.length > 0 && !editingId) {
      setEditingId(FEED_NEW_COMMENT)
    }
  }, [filteredAnnotations])

  const handleGoToAnnotation = (annotation: AnnotationPreview) => {
    const firstFrame = annotation.range[0]
    onGoToFrame?.(firstFrame)
  }

  return {
    annotations: filteredAnnotations,
    goToAnnotation: handleGoToAnnotation,
    removeAnnotation,
  }
}

export default useAnnotationsSync
