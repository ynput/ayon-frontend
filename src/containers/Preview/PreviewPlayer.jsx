import { useEffect, useState } from 'react'
import { PreviewPlayerWrapper } from './Preview.styled'
import VideoPlayer from '/src/containers/VideoPlayer'
import EmptyPlaceholder from '/src/components/EmptyPlaceholder/EmptyPlaceholder'

const PreviewPlayer = ({ projectName, reviewable }) => {

  const [frameRate, setFrameRate] = useState(25)
  const [aspectRatio, setAspectRatio] = useState(1.7777777777777777)

  if (!reviewable) return (
    <PreviewPlayerWrapper>
      <EmptyPlaceholder
        icon="hide_image"
        message={'This version has no previewable content.'}
      />
    </PreviewPlayerWrapper>
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
    <PreviewPlayerWrapper>
      <VideoPlayer 
        src={videoSrc} 
        frameRate={frameRate}
        aspectRatio={aspectRatio}
      />
    </PreviewPlayerWrapper>
  )
}

export default PreviewPlayer
