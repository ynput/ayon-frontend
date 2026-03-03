import { useState, useRef, useMemo } from 'react'
import styled from 'styled-components'

import VideoOverlay from './VideoOverlay'
import Trackbar from './Trackbar'
import VideoPlayerControls from './VideoPlayerControls'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import clsx from 'clsx'
import useGoToFrame from './hooks/useGoToFrame'
import { useViewer } from '@context/ViewerContext'

import usePlayerPreferences from './hooks/usePlayerPreferences'
import useVideoPlayback from './hooks/useVideoPlayback'
import useVideoSeeking from './hooks/useVideoSeeking'
import useVideoSourceTransition from './hooks/useVideoSourceTransition'
import useVideoDimensions from './hooks/useVideoDimensions'

import './utils/videoFrameCallbackPolyfill'

const VideoPlayerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;

  video {
    object-fit: fill !important;
    padding: 0;
    margin: 0;
  }

  .video-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    background-color: black;
    &.no-content {
      background-color: unset;
    }
    padding: 0;
    overflow: hidden;

    .video-wrapper {
      position: relative;
      padding: 0;
      margin: 0;
    }
  }

  .controls-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 4px;
    padding: 4px;
  }
`

const AnnotationsContainer = styled.div`
  position: absolute;
  inset: 0;
`

const VideoPlayer = ({ src, frameRate, aspectRatio, autoplay, onPlay, reviewableId }) => {
  const {
    createToolbar,
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    isLoaded: isLoadedAnnotations,
    useAnnotations,
  } = useViewer()

  const videoRef = useRef(null)
  const videoRowRef = useRef(null)
  const isTransitioning = useRef(false)

  const [loadError, setLoadError] = useState(null)
  const [bufferedRanges, setBufferedRanges] = useState([])

  // 1. Preferences (independent)
  const { showOverlay, setShowOverlay, loop, setLoop, muted, setMuted } = usePlayerPreferences()

  // 2. Playback (needs refs)
  const { currentTime, setCurrentTime, duration, setDuration, isPlaying, setIsPlaying, currentFrame, frameCount } =
    useVideoPlayback(videoRef, frameRate, isTransitioning)

  // 3. Seeking (needs playback setters)
  const {
    seekToFrame,
    handleScrub,
    handlePause,
    seekPreferredInitialPosition,
    initialPosition,
    seekedToInitialPosition,
  } = useVideoSeeking(videoRef, frameRate, isTransitioning, { setIsPlaying })

  // 5. Dimensions (needs showStill from transition)
  // Declared before transition so we can pass setters via onMetadataLoaded
  const { videoDimensions, setVideoDimensions, actualVideoDimensions, setActualVideoDimensions } =
    useVideoDimensions(videoRowRef, aspectRatio, false) // showStill handled by transition re-triggering resize

  // 4. Source transition (needs seekPreferredInitialPosition + dimension setters)
  const { actualSource, showStill, setShowStill } = useVideoSourceTransition(
    src,
    videoRef,
    isTransitioning,
    {
      seekPreferredInitialPosition,
      setCurrentTime,
      initialPosition,
      onMetadataLoaded: ({ duration, dimensions, actualDimensions, isPaused }) => {
        setDuration(duration)
        setVideoDimensions(dimensions)
        setActualVideoDimensions(actualDimensions)
        setIsPlaying(!isPaused)
        setBufferedRanges([])
      },
    },
  )

  useGoToFrame({ setCurrentTime, frameRate, duration, videoElement: videoRef.current })

  const { annotations } = useAnnotations()

  const annotatedFrames = useMemo(() => {
    const frames = Object.values(annotations).flatMap(({ range }) => range)
    return Array.from(new Set(frames))
  }, [annotations])

  const handleLoad = () => {
    console.debug('VideoPlayer: handleLoad')
    if (autoplay) {
      setMuted(true)
      videoRef.current.muted = true
      videoRef.current.play()
    } else {
      setMuted(false)
      videoRef.current.muted = false
      setIsPlaying(false)
    }
    if (videoRef.current?.duration < currentTime) {
      const lastFrameTime = Math.max(0, videoRef.current.duration - 1 / frameRate)
      setCurrentTime(lastFrameTime)
      initialPosition.current = lastFrameTime
    }
    setBufferedRanges([])
    setLoadError(null)
    seekedToInitialPosition.current = false
  }

  const handleLoadError = (e) => {
    const code = e.target.error.code
    if (code === 4) {
      setLoadError({ code, message: 'No review for this version' })
    } else {
      setLoadError({ code, message: 'Error loading video' })
    }
    setShowStill(false)
  }

  const handleProgress = (e) => {
    if (isTransitioning.current) return
    const buffered = e.target.buffered
    if (!buffered.length) return
    const ranges = []
    for (let i = 0; i < buffered.length; i++) {
      ranges.push({ start: buffered.start(i) * frameRate, end: buffered.end(i) * frameRate })
    }
    setBufferedRanges(ranges)
  }

  const handleOnPlay = () => {
    onPlay && onPlay()
    setIsPlaying(true)
  }

  const handleEnded = () => {
    if (loop) {
      console.debug('VideoPlayer: Ended, looping')
      videoRef.current.currentTime = 0
      videoRef.current.play()
      return
    }
    console.debug('VideoPlayer: Ended, not looping')
    setIsPlaying(false)
  }

  const handlePlayPause = () => {
    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  const handleMuteToggle = (value) => {
    setMuted(value)
    videoRef.current.muted = value
  }

  return (
    <VideoPlayerContainer>
      <AnnotationsEditorProvider
        backgroundRef={videoRef}
        containerDimensions={actualVideoDimensions}
        pageNumber={currentFrame}
        id={reviewableId}
        src={src}
        mediaType="video"
        atMediaTime={videoRef.current?.currentTime || 0}
      >
        <div
          className={clsx('video-row video-container', { 'no-content': loadError })}
          ref={videoRowRef}
        >
          <div
            className="video-wrapper"
            style={{
              width: videoDimensions.width,
              height: videoDimensions.height,
              position: 'relative',
            }}
          >
            <video
              ref={videoRef}
              width={videoDimensions.width}
              height={videoDimensions.height}
              src={actualSource}
              onProgress={handleProgress}
              onEnded={handleEnded}
              onPlay={handleOnPlay}
              onPause={handlePause}
              onLoadedData={handleLoad}
              onError={handleLoadError}
              muted={muted}
              crossOrigin="anonymous"
            />
            <VideoOverlay
              videoWidth={videoDimensions.width}
              videoHeight={videoDimensions.height}
              showOverlay={showOverlay}
              showStill={showStill}
              videoRef={videoRef}
            />
            {AnnotationsCanvas && isLoadedAnnotations && (
              <AnnotationsContainer style={{ visibility: isPlaying ? 'hidden' : 'visible' }}>
                {actualVideoDimensions && (
                  <AnnotationsCanvas
                    width={actualVideoDimensions.width}
                    height={actualVideoDimensions.height}
                  />
                )}
              </AnnotationsContainer>
            )}
          </div>
        </div>
        {createToolbar()}
      </AnnotationsEditorProvider>

      <div className="trackbar-row">
        <Trackbar
          currentFrame={currentFrame}
          frameCount={frameCount}
          frameRate={frameRate}
          onScrub={handleScrub}
          bufferedRanges={bufferedRanges}
          isPlaying={isPlaying}
          highlighted={annotatedFrames}
        />
      </div>

      <div className="controls-row">
        <VideoPlayerControls
          isPlaying={isPlaying}
          handlePlayPause={handlePlayPause}
          seekToFrame={seekToFrame}
          frameCount={frameCount}
          currentFrame={currentFrame}
          setMuted={handleMuteToggle}
          {...{ showOverlay, setShowOverlay, loop, setLoop, muted }}
        />
      </div>
      {loadError && (
        <EmptyPlaceholder
          icon="hide_image"
          message={'Unable to load video.'}
          error={loadError?.code !== 4 && loadError?.message}
        />
      )}
    </VideoPlayerContainer>
  )
}

export default VideoPlayer
