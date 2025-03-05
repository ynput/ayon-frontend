import { AnnotationMetadata } from '@containers/Viewer'
import { FEED_NEW_COMMENT, useFeed } from '@context/FeedContext'
import { useViewer } from '@context/viewerContext'
import { useAppDispatch } from '@state/store'
import { goToFrame } from '@state/viewer'
import { useEffect } from 'react'

type Props = {
  entityId: string
  filesUploading: File[]
}

export type AnnotationPreview = AnnotationMetadata & {
  isAnnotation: true
}

// annotations are temporary store
export const filterEntityAnnotations = (
  annotations: Record<string, AnnotationMetadata>,
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
  const { editingId, setEditingId } = useFeed();

  // listen to the viewer for annotations
  // later on, other hooks can be tried here to get annotations from different sources
  const { useAnnotations } = useViewer();
  const { annotations, removeAnnotation } = useAnnotations();
  // filter out annotations that are for this entity and are NOT uploading
  const filteredAnnotations = filterEntityAnnotations(annotations, entityId, filesUploading)

  // when annotations change, update the state
  useEffect(() => {
    // open the comment input if there are annotations and something is not being edited already
    if (filteredAnnotations.length > 0 && !editingId) {
      setEditingId(FEED_NEW_COMMENT)
    }
  }, [filteredAnnotations])

  const handleGoToAnnotation = (annotation: AnnotationPreview) => {
    const firstFrame = annotation.range[0]
    dispatch(goToFrame(firstFrame - 1))
  }

  return {
    annotations: filteredAnnotations,
    goToAnnotation: handleGoToAnnotation,
    removeAnnotation,
  }
}

export default useAnnotationsSync
