import { useState } from 'react'
import { ReviewPlayerWrapper } from './Review.styled'
import VideoPlayer from '@containers/VideoPlayer'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'

const ReviewPlayer = ({ projectName, reviewable }) => {
  const [frameRate, setFrameRate] = useState(25)
  const [aspectRatio, setAspectRatio] = useState(1.7777777777777777)

  if (!reviewable)
    return (
      <ReviewPlayerWrapper>
        <EmptyPlaceholder icon="hide_image" message={'This version has no reviewable content.'} />
      </ReviewPlayerWrapper>
    )

  // TODO: load from reviewable.attrib

  // useEffect(() => {
  //   if (!attrib?.length) return
  //   const { fps, resolutionWidth, resolutionHeight } = attrib
  //   setFrameRate(fps)
  //   setAspectRatio(resolutionWidth / resolutionHeight)
  // }, [attrib])

  const videoSrc = `/api/projects/${projectName}/files/${reviewable.fileId}`

  return (
    <ReviewPlayerWrapper>
      <VideoPlayer src={videoSrc} frameRate={frameRate} aspectRatio={aspectRatio} />
    </ReviewPlayerWrapper>
  )
}

export default ReviewPlayer
