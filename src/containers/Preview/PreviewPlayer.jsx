import { useEffect, useState } from 'react'
import { PreviewPlayerWrapper } from './Preview.styled'
import VideoPlayer from '/src/containers/VideoPlayer'

const PreviewPlayer = ({ versionId, projectName, attrib }) => {

  const [frameRate, setFrameRate] = useState(25)
  const [aspectRatio, setAspectRatio] = useState(1.7777777777777777)



  useEffect(() => {
    if (!attrib?.length) return
    const { fps, resolutionWidth, resolutionHeight } = attrib
    setFrameRate(fps)
    setAspectRatio(resolutionWidth / resolutionHeight)
  }, [attrib])
  
  const videoSrc = `/api/projects/${projectName}/versions/${versionId}/review/main.mp4`

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
