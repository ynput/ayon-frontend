import { PreviewPlayerWrapper } from './Preview.styled'
import VideoPlayer from '/src/containers/VideoPlayer'

const PreviewPlayer = ({ selected, projectName }) => {

  // TODO: framerate and aspect ratio should be fetched from the server
  // for now, hardcoding them. They are super important for the player to work correctly
  const frameRate = 25
  const aspectRatio = 1.7777777777777777

  const videoSrc = `/api/projects/${projectName}/versions/${selected.join(',')}/review/main.mp4`

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
