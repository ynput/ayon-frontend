import { Suspense, lazy, useEffect, useState } from 'react'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import type { FeedActivityMediaInfo } from '@shared/api'
import { getFileURL } from '../fileUtils'
import * as Styled from '../FileUploadPreview.styled'

// the player drags in its own dependency tree, so only fetch it once a video is expanded
// (it also imports back from the shared Feed entry, which a static import would make a cycle)
const importVideoPlayer = () => import('./VideoPlayer')
const VideoPlayer = lazy(importVideoPlayer)

type VideoMetadata = {
  duration: number
  width: number
  height: number
  fps?: number
  codec?: string
}

type ProbeResult =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; metadata: VideoMetadata }

// Infinity/NaN duration (streamed webm) or a zero size would feed NaN into the player's timeline math
const isPlayable = ({ duration, width, height }: VideoMetadata) =>
  Number.isFinite(duration) && duration > 0 && width > 0 && height > 0

const PROBE_TIMEOUT_MS = 10000

const describeMediaError = (error: MediaError | null) =>
  error ? `code ${error.code}${error.message ? `: ${error.message}` : ''}` : 'no MediaError'

// files uploaded before the server started ffprobing have no mediaInfo, so the browser probe stays
const useVideoMetadata = (url: string, mediaInfo?: FeedActivityMediaInfo | null): ProbeResult => {
  const [result, setResult] = useState<ProbeResult>({ status: 'loading' })

  useEffect(() => {
    setResult({ status: 'loading' })

    let cancelled = false
    let probe: HTMLVideoElement | null = null
    let timeout: ReturnType<typeof setTimeout>

    const cleanupProbe = () => {
      if (!probe) return
      probe.removeEventListener('loadedmetadata', handleLoaded)
      probe.removeEventListener('error', handleError)
      probe.removeAttribute('src')
      probe.load()
      probe = null
    }

    function handleLoaded() {
      if (cancelled || !probe) return
      clearTimeout(timeout)
      const metadata = {
        duration: probe.duration,
        width: probe.videoWidth,
        height: probe.videoHeight,
      }
      if (isPlayable(metadata)) {
        cleanupProbe()
        setResult({ status: 'ready', metadata })
        return
      }
      fail(`unusable metadata ${JSON.stringify(metadata)}`)
    }

    function handleError() {
      if (cancelled) return
      clearTimeout(timeout)
      fail(describeMediaError(probe?.error ?? null))
    }

    // preload=metadata only reads the head of the file; a video whose moov atom sits after
    // mdat needs the whole thing before duration and dimensions are known
    const fail = (reason: string) => {
      const wasMetadataOnly = probe?.preload === 'metadata'
      cleanupProbe()
      if (wasMetadataOnly) {
        console.warn(`[VideoMime] metadata probe failed (${reason}), retrying with full preload`)
        startProbe('auto')
        return
      }
      console.warn(`[VideoMime] video cannot be played: ${reason}`, url)
      setResult({ status: 'error' })
    }

    function startProbe(preload: 'metadata' | 'auto') {
      probe = document.createElement('video')
      probe.preload = preload
      probe.muted = true
      probe.playsInline = true

      // a stalled media pipeline never fires loadedmetadata nor error
      timeout = setTimeout(() => !cancelled && fail('timed out'), PROBE_TIMEOUT_MS)

      probe.addEventListener('loadedmetadata', handleLoaded)
      probe.addEventListener('error', handleError)
      probe.src = url
    }

    startProbe('metadata')

    return () => {
      cancelled = true
      clearTimeout(timeout)
      cleanupProbe()
    }
  }, [url])

  if (result.status !== 'ready') return result

  return {
    status: 'ready',
    metadata: {
      ...result.metadata,
      duration: mediaInfo?.duration || result.metadata.duration,
      width: mediaInfo?.width || result.metadata.width,
      height: mediaInfo?.height || result.metadata.height,
      fps: mediaInfo?.frameRate,
      codec: mediaInfo?.codec,
    },
  }
}

interface VideoMimeProps {
  file: {
    id: string
    projectName: string
    name: string
    mediaInfo?: FeedActivityMediaInfo | null
  }
}

const VideoMime = ({ file }: VideoMimeProps) => {
  const { id, projectName, name, mediaInfo } = file
  const url = getFileURL(id, projectName)
  const probe = useVideoMetadata(url, mediaInfo)

  // Suspense would only start the chunk request once the probe resolves, serialising two slow steps
  useEffect(() => {
    importVideoPlayer()
  }, [])

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
        fps={probe.metadata.fps}
        codec={probe.metadata.codec}
      />
    </Suspense>
  )
}

export default VideoMime
