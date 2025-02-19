import { ReviewableResponse } from '@queries/review/types'
import { useAppDispatch, useAppSelector } from '@state/store'
import { addAnnotation, Annotation, removeAnnotation } from '@state/viewer'
import { useMemo } from 'react'

export type AnnotationMetadata = {
  id: string
  page: number
  operation: 'add' | 'remove'
  width?: number
  height?: number
  annotationData?: string // base64 image
  compositeData?: string // base64 image
}

export type AnnotationsContainerDimensions = {
  width?: number;
  height?: number;
}

export type AnnotationsProviderProps = {
  children: React.ReactNode
  id?: string
  backgroundRef?: React.MutableRefObject<
    HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | null
  >
  containerDimensions: AnnotationsContainerDimensions | null
  pageNumber: number
  annotations?: Map<string, string | null> | undefined
  onAnnotationsChange?:
    | ((value: Map<string, string>, metadata: AnnotationMetadata) => void)
    | undefined
}

export type ViewAnnotationsProps = {
  selectedVersionId?: string
  reviewable?: ReviewableResponse
}

export type ViewerAnnotations = {
  annotations: Map<string, string>
  frames: number[]
  addAnnotation: (annotations: Map<string, string>, data: AnnotationMetadata) => void
}

export const useViewerAnnotations = ({
  reviewable,
  selectedVersionId,
}: ViewAnnotationsProps): ViewerAnnotations => {
  const dispatch = useAppDispatch()
  const annotations = useAppSelector((state) => state.viewer.annotations)
  const annotationsMap = useMemo(() => {
    return new Map(
      Object.entries(annotations).map(([id, annotation]) => [id, annotation.annotationData]),
    )
  }, [annotations])

  const uniqueAnnotatedFrames = useMemo(() => {
    const annotatedFrames = Object.values(annotations).flatMap((a) => a.range)
    return Array.from(new Set(annotatedFrames))
  }, [annotations])

  const handleNewAnnotation = (_annotations: Map<string, string>, data: AnnotationMetadata) => {
    if (!selectedVersionId || !reviewable) return

    if (data.operation === 'remove') {
      dispatch(removeAnnotation(data.id))
    } else if (data.operation === 'add') {
      // construct full annotation object
      const annotation: Annotation = {
        id: data.id,
        name: `${data.page}-${data.page}.png`,
        annotationData: data.annotationData || '',
        compositeData: data.compositeData || '',
        range: [data.page, data.page],
        width: data.width || 0,
        height: data.height || 0,
        reviewableId: reviewable.activityId,
        versionId: selectedVersionId,
      }

      dispatch(addAnnotation(annotation))
    }
  }

  return {
    annotations: annotationsMap,
    frames: uniqueAnnotatedFrames,
    addAnnotation: handleNewAnnotation,
  }
}
