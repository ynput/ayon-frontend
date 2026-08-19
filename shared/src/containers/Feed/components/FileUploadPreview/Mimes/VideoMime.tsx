import { Suspense, lazy, useEffect, useState } from 'react'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import { getFileURL } from '../fileUtils'
import * as Styled from '../FileUploadPreview.styled'

// the player drags in its own dependency tree, so only fetch it once a video is expanded
// (it also imports back from the shared Feed entry, which a static import would make a cycle)
const VideoPlayer = lazy(() => import('./VideoPlayer'))

type VideoMetadata = {
  duration: number
  width: number
  height: number
}

type ProbeResult =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; metadata: VideoMetadata }

// Infinity/NaN duration (streamed webm) or a zero size would feed NaN into the player's timeline math
const isPlayable = ({ duration, width, height }: VideoMetadata) =>
  Number.isFinite(duration) && duration > 0 && width > 0 && height > 0

const useVideoMetadata = (url: string): ProbeResult => {
  const [result, setResult] = useState<ProbeResult>({ status: 'loading' })

  useEffect(() => {
    setResult({ status: 'loading' })

    const probe = document.createElement('video')
    probe.preload = 'metadata'

    const handleLoaded = () => {
      const metadata = {
        duration: probe.duration,
        width: probe.videoWidth,
        height: probe.videoHeight,
      }
      setResult(isPlayable(metadata) ? { status: 'ready', metadata } : { status: 'error' })
    }
    const handleError = () => setResult({ status: 'error' })

    probe.addEventListener('loadedmetadata', handleLoaded)
    probe.addEventListener('error', handleError)
    probe.src = url

    return () => {
      probe.removeEventListener('loadedmetadata', handleLoaded)
      probe.removeEventListener('error', handleError)
      probe.removeAttribute('src')
      probe.load()
    }
  }, [url])

  return result
}

interface VideoMimeProps {
  file: {
    id: string
    projectName: string
    name: string
  }
}

const VideoMime = ({ file }: VideoMimeProps) => {
  const { id, projectName, name } = file
  const url = getFileURL(id, projectName)
  const probe = useVideoMetadata(url)

  if (probe.status === 'error') {
    return (
      <Styled.PlayerWrapper>
        <EmptyPlaceholder icon="videocam_off" message="This video cannot be played in the browser">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Download {name}
          </a>
        </EmptyPlaceholder>
      </Styled.PlayerWrapper>
    )
  }

  const loading = (
    <Styled.PlayerWrapper>
      <EmptyPlaceholder icon="hourglass_empty" message="Loading video..." />
    </Styled.PlayerWrapper>
  )

  if (probe.status === 'loading') return loading

  return (
    <Suspense fallback={loading}>
      <VideoPlayer
        id={id}
        name={name}
        url={url}
        projectName={projectName}
        duration={probe.metadata.duration}
        width={probe.metadata.width}
        height={probe.metadata.height}
      />
    </Suspense>
  )
}

export default VideoMime
