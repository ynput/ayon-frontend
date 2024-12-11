import { useEffect, useMemo, useState } from 'react'
import VideoPlayer from '@containers/VideoPlayer'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { Button } from '@ynput/ayon-react-components'
import { useAppDispatch, useAppSelector } from '@state/store'
import { addAnnotation, Annotation, removeAnnotation } from '@state/viewer'
import { ReviewableResponse } from '@queries/review/types'

type AnnotationMetadata = {
  id: string
  page: number
  operation: 'add' | 'remove'
  width?: number
  height?: number
  annotationData?: string // base64 image
  compositeData?: string // base64 image
}

interface ViewerPlayerProps {
  projectName: string
  reviewable: ReviewableResponse
  selectedVersionId?: string
  onUpload: () => void
  autoplay: boolean
  onPlay: () => void
}

const ViewerPlayer = ({
  projectName,
  reviewable,
  selectedVersionId,
  onUpload,
  autoplay,
  onPlay,
}: ViewerPlayerProps) => {
  const dispatch = useAppDispatch()

  const [frameRate, setFrameRate] = useState<null | number>(null)
  const [aspectRatio, setAspectRatio] = useState<null | number>(null)

  useEffect(() => {
    const mediaInfo = reviewable?.mediaInfo
    if (!mediaInfo) return
    const { frameRate, width, height } = mediaInfo
    // all are not undefined
    if (frameRate !== undefined && width !== undefined && height !== undefined) {
      setFrameRate(frameRate)
      setAspectRatio(width / height)
    }
  }, [reviewable])

  if (!reviewable)
    return (
      <EmptyPlaceholder icon="hide_image" message={'This version has no reviewable content.'}>
        <Button icon="add" onClick={onUpload}>
          Upload reviewable
        </Button>
      </EmptyPlaceholder>
    )

  const videoSrc = `/api/projects/${projectName}/files/${reviewable.fileId}`

  const annotations = useAppSelector((state) => state.viewer.annotations)

  const annotationsMap = useMemo(() => {
    return new Map(
      Object.entries(annotations).map(([id, annotation]) => [id, annotation.annotationData]),
    )
  }, [annotations])

  const handleNewAnnotation = (_annotations: Map<string, string>, data: AnnotationMetadata) => {
    if (!selectedVersionId) return

    if (data.operation === 'remove') {
      console.log(data)
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

  return (
    frameRate &&
    aspectRatio && (
      <VideoPlayer
        src={videoSrc}
        frameRate={frameRate}
        aspectRatio={aspectRatio}
        autoplay={autoplay}
        onPlay={onPlay}
        reviewableId={reviewable.activityId}
        annotations={annotationsMap}
        onAnnotation={handleNewAnnotation}
        // label={reviewable.label}
      />
    )
  )
}

export default ViewerPlayer
