import { useEffect, useState } from 'react'
import { ReviewPlayerWrapper } from './Review.styled'
import VideoPlayer from '@containers/VideoPlayer'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'

const ReviewPlayer = ({ projectName, reviewable }) => {
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
      <ReviewPlayerWrapper>
        <EmptyPlaceholder icon="hide_image" message={'This version has no reviewable content.'} />
      </ReviewPlayerWrapper>
    )

  const videoSrc = `/api/projects/${projectName}/files/${reviewable.fileId}`

  return (
    <ReviewPlayerWrapper>
      {frameRate && aspectRatio && (
        <VideoPlayer src={videoSrc} frameRate={frameRate} aspectRatio={aspectRatio} />
      )}
    </ReviewPlayerWrapper>
  )
}

export default ReviewPlayer
