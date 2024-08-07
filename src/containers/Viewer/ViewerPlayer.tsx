import { useEffect, useState } from 'react'
import VideoPlayer from '@containers/VideoPlayer'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { Button } from '@ynput/ayon-react-components'

interface ViewerPlayerProps {
  projectName: string
  reviewable: any
  onUpload: () => void
  autoplay: boolean
  onPlay: () => void
}

const ViewerPlayer = ({
  projectName,
  reviewable,
  onUpload,
  autoplay,
  onPlay,
}: ViewerPlayerProps) => {
  const [frameRate, setFrameRate] = useState<null | number>(null)
  const [aspectRatio, setAspectRatio] = useState<null | number>(null)

  useEffect(() => {
    const mediaInfo = reviewable?.mediaInfo
    if (!mediaInfo) return
    const { frameRate, width, height } = mediaInfo
    setFrameRate(frameRate)
    setAspectRatio(width / height)
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

  return (
    frameRate &&
    aspectRatio && (
      <VideoPlayer
        src={videoSrc}
        frameRate={frameRate}
        aspectRatio={aspectRatio}
        autoplay={autoplay}
        onPlay={onPlay}
      />
    )
  )
}

export default ViewerPlayer
