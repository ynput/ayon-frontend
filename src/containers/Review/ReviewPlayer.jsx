import { useEffect, useState } from 'react'
import VideoPlayer from '@containers/VideoPlayer'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { Button } from '@ynput/ayon-react-components'

const ReviewPlayer = ({ projectName, reviewable, onUpload }) => {
  const [frameRate, setFrameRate] = useState(null)
  const [aspectRatio, setAspectRatio] = useState(null)

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
    aspectRatio && <VideoPlayer src={videoSrc} frameRate={frameRate} aspectRatio={aspectRatio} />
  )
}

export default ReviewPlayer
