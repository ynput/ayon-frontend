import { useEffect } from 'react'
import { FEED_NEW_COMMENT, useFeedContext } from '../../../context/FeedContext'
import { useDetailsPanelContext } from '@shared/context'

type Props = {
  entityId: string
  filesUploading: File[]
}

export type AnnotationPreview = any & {
  unsavedAnnotation: any
}

// annotations are temporary store
export const filterEntityAnnotations = (
  annotations: Record<string, any>,
  entityId: string,
  filesUploading: File[],
): AnnotationPreview[] => {
  if (!entityId) {
    console.warn('filterEntityAnnotations: entityId is empty')
  }
  // Check if any annotation has empty versionId
  Object.values(annotations).forEach((annotation) => {
    if (!annotation.versionId) {
      console.warn('filterEntityAnnotations: annotation.versionId is empty', annotation)
    }
  })

  return Object.values(annotations)
    .filter(
      (annotation) =>
        annotation.versionId === entityId &&
        !filesUploading.some((file) => file.name === annotation.name),
    )
    .map((annotationFile) => ({
      ...annotationFile,
      unsavedAnnotation: annotationFile,
    })) as AnnotationPreview[]
}

const useAnnotationsSync = ({ entityId, filesUploading }: Props) => {
  const { editingId, setEditingId, annotations, removeAnnotation } = useFeedContext()
  const { onGoToFrame } = useDetailsPanelContext()

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
