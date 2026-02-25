import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import styled from 'styled-components'

import VideoOverlay from './VideoOverlay'
import Trackbar from './Trackbar'
import VideoPlayerControls from './VideoPlayerControls'
import EmptyPlaceholder from '@shared/components/EmptyPlaceholder'
import clsx from 'clsx'
import useGoToFrame from './hooks/useGoToFrame'
import { useViewer } from '@context/ViewerContext'

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

  const initialPosition = useRef(0) // in seconds
  const seekedToInitialPosition = useRef(false)
  const isTransitioning = useRef(false)
  const pendingSourceRef = useRef(null)
  const transitionGenRef = useRef(0) // incremented each transition, used to discard stale callbacks
  const rvfcIdRef = useRef(null) // track rVFC callback ID for cancellation
  const [transitionTick, setTransitionTick] = useState(0)

  const [currentTime, setCurrentTime] = useState(0) // in seconds
  const [duration, setDuration] = useState(0) // in seconds
  const [bufferedRanges, setBufferedRanges] = useState([]) // here we use frames

  const [isPlaying, setIsPlaying] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [actualSource, setActualSource] = useState(src)
  const [showStill, setShowStill] = useState(false)

  // user preferences (persist somewhere?)
  const [showOverlay, setShowOverlay] = useState(false)
  const [loop, setLoop] = useState(true)
  const [muted, setMuted] = useState(false)

  const [videoDimensions, setVideoDimensions] = useState({
    width: null,
    height: null,
  })
  // used to set intrinsic size for the Annotations canvas
  const [actualVideoDimensions, setActualVideoDimensions] = useState(null)

  useGoToFrame({ setCurrentTime, frameRate, duration, videoElement: videoRef.current })

  const { annotations } = useAnnotations()

  const annotatedFrames = useMemo(() => {
    const annotatedFrames = Object.values(annotations).flatMap(({ range }) => range)
    return Array.from(new Set(annotatedFrames))
  }, [annotations])

  //
  // Video size handling
  //

  useEffect(() => {
    if (!videoRowRef.current || showStill) return

    const updateVideoDimensions = () => {
      const clientWidth = videoRowRef.current?.clientWidth
      const clientHeight = videoRowRef.current?.clientHeight

      if (clientWidth / clientHeight > aspectRatio) {
        const width = Math.round(clientHeight * aspectRatio)
        const height = clientHeight
        setVideoDimensions({ width, height })
      } else {
        const width = clientWidth
        const height = Math.round(clientWidth / aspectRatio)
        setVideoDimensions({ width, height })
      }
    }

    updateVideoDimensions()

    const resizeObserver = new ResizeObserver(updateVideoDimensions)
    resizeObserver.observe(videoRowRef.current)
    return () => {
      if (!videoRowRef.current) return
      resizeObserver.unobserve(videoRowRef.current)
    }
  }, [videoRowRef, aspectRatio, showStill])

  //
  // Player initialization / video loading
  //

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleLoadedMetadata = () => {
      console.debug('VideoPlayer: Metadata loaded. Duration: ', videoElement.duration)
      setDuration(videoRef.current?.duration)
      const width = videoRef.current?.clientWidth
      const height = videoRef.current?.clientHeight
      setVideoDimensions({ width, height })
      setActualVideoDimensions({
        width: videoRef.current?.videoWidth,
        height: videoRef.current?.videoHeight,
      })
      setIsPlaying(!videoRef.current?.paused)
      setBufferedRanges([])
    }

    const handleCanPlay = () => {
      // Guard: if a newer transition already started, this canplay is stale
      if (!isTransitioning.current) return
      const didSeek = seekPreferredInitialPosition()

      const revealVideo = () => {
        // Capture generation at the time reveal is requested
        const gen = transitionGenRef.current
        // Double rVFC: first confirms decode, second confirms it's paintable
        rvfcIdRef.current = videoRef.current?.requestVideoFrameCallback(() => {
          // Stale check: a newer transition may have started
          if (gen !== transitionGenRef.current) return
          rvfcIdRef.current = videoRef.current?.requestVideoFrameCallback(() => {
            if (gen !== transitionGenRef.current) return
            isTransitioning.current = false
            setShowStill(false)
          })
        })
      }

      if (didSeek) {
        const gen = transitionGenRef.current
        const onSeeked = () => {
          if (gen !== transitionGenRef.current) return // stale seek from previous transition
          revealVideo()
        }
        videoRef.current?.addEventListener('seeked', onSeeked, { once: true })
      } else {
        revealVideo()
      }
    }

    // Attach event listeners
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('canplay', handleCanPlay)

    // Cleanup event listeners and pending rVFC on unmount
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('canplay', handleCanPlay)
      if (rvfcIdRef.current != null) {
        videoElement.cancelVideoFrameCallback(rvfcIdRef.current)
        rvfcIdRef.current = null
      }
    }
  }, [videoRef.current])

  // Step 1: When src changes, capture still + mark transitioning
  useEffect(() => {
    console.debug('VideoPlayer: source changed to', src)
    if (!videoRef.current) return
    // Invalidate any pending rVFC/seeked callbacks from previous transition
    transitionGenRef.current += 1
    if (rvfcIdRef.current != null) {
      videoRef.current.cancelVideoFrameCallback(rvfcIdRef.current)
      rvfcIdRef.current = null
    }
    isTransitioning.current = true
    pendingSourceRef.current = src
    setShowStill(true)
    setCurrentTime(initialPosition.current)
    setTransitionTick((t) => t + 1)
  }, [src])

  // Step 2: After React has committed the still overlay, swap the source synchronously
  // useLayoutEffect ensures the source swap happens before the browser paints,
  // eliminating the timing gap that causes flashes
  useLayoutEffect(() => {
    if (!pendingSourceRef.current) return
    const source = pendingSourceRef.current
    pendingSourceRef.current = null
    setActualSource(source)
  }, [transitionTick])

  // Safety timeout to prevent isTransitioning from getting stuck forever
  useEffect(() => {
    if (!isTransitioning.current) return
    const timeout = setTimeout(() => {
      if (isTransitioning.current) {
        console.warn('VideoPlayer: Transition timed out, forcing reveal')
        isTransitioning.current = false
        setShowStill(false)
      }
    }, 3000)
    return () => clearTimeout(timeout)
  }, [transitionTick])

  const handleLoad = () => {
    console.debug('VideoPlayer: handleLoad')
    if (autoplay) {
      setMuted(true)
      // mute the video
      videoRef.current.muted = true
      videoRef.current.play()
    } else {
      setMuted(false)
      // mute the video
      videoRef.current.muted = false
      setIsPlaying(false)
    }
    if (videoRef.current?.duration < currentTime) {
      const lastFrameTime = Math.max(0, videoRef.current.duration - (1 / frameRate))
      setCurrentTime(lastFrameTime)
      initialPosition.current = lastFrameTime
    }
    setBufferedRanges([])
    setLoadError(null)
    seekedToInitialPosition.current = false
  }

  const handleLoadError = (e) => {
    // check if the video is 404
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
    // create a list of buffered time ranges
    const buffered = e.target.buffered
    if (!buffered.length) return
    const bufferedRanges = []
    // buffered returns time ranges in seconds,
    // but we are passing it to the trackbar component,
    // that uses frames internally, so we convert it here
    for (var i = 0; i < buffered.length; i++) {
      const r = { start: buffered.start(i) * frameRate, end: buffered.end(i) * frameRate }
      bufferedRanges.push(r)
    }
    setBufferedRanges(bufferedRanges)
  }

  //
  // Video position / currentTime handling
  //

  const handleOnPlay = () => {
    onPlay && onPlay()
    setIsPlaying(true)
  }

  const frameCallbackRef = useRef(null)

  const updateCurrentTime = (now, metadataInfo) => {
    if (!isTransitioning.current) {
      setCurrentTime(metadataInfo.mediaTime)
    }
    const video = videoRef.current
    if (!video) return

    if (typeof frameCallbackRef.current === 'function') {
      frameCallbackRef.current()
    }

    frameCallbackRef.current = video.requestVideoFrameCallback(updateCurrentTime)
  }

  useEffect(() => {
    if (!videoRef.current) return
    const video = videoRef.current

    if (typeof frameCallbackRef.current === 'function') {
      frameCallbackRef.current()
    }

    frameCallbackRef.current = video.requestVideoFrameCallback(updateCurrentTime)

    return () => {
      if (typeof frameCallbackRef.current === 'function') {
        frameCallbackRef.current()
        frameCallbackRef.current = null
      }
    }
  }, [videoRef.current])

  // I guess using useMemo here would cause much higher overhead :)

  const currentFrame = Math.round(currentTime * frameRate)
  const frameCount = Math.round(duration * frameRate)

  // Get the video duration

  useEffect(() => {
    if (!videoRef.current) return
    const actualDuration = videoRef.current?.duration
    if (actualDuration !== duration) {
      setDuration(actualDuration)
    }
  }, [videoRef, isPlaying, duration])

  const seekPreferredInitialPosition = () => {
    // Called when version is changed to maintain the frame position
    // so the user can compare two frames across versions.
    // Returns true if a seek was initiated (async), false otherwise.
    if (seekedToInitialPosition.current) return false
    seekedToInitialPosition.current = true

    const newTime = initialPosition.current
    if (isNaN(newTime) || newTime < 0) return false

    // Clamp to new video's duration
    const dur = videoRef.current?.duration
    if (!dur || isNaN(dur)) return false
    const clampedTime = Math.min(newTime, dur - 0.001)

    // Always seek if we have a non-zero target
    if (clampedTime > 0) {
      console.debug(
        'VideoPlayer: Setting initial position',
        clampedTime,
        'from',
        videoRef.current?.currentTime,
      )
      seekToTime(clampedTime)
      return true
    }

    return false
  }

  const seekToTime = (newTime) => {
    // seek to time specified in seconds.
    // this is not used directly (as we use seekToFrame)
    const videoElement = videoRef.current
    if (newTime === videoRef.current?.currentTime) return
    if (videoElement.readyState >= 3) {
      // HAVE_FUTURE_DATA
      videoElement.currentTime = newTime
    } else {
      const onCanPlay = () => {
        videoElement.currentTime = newTime
        videoElement.removeEventListener('canplay', onCanPlay)
      }
      videoElement.addEventListener('canplay', onCanPlay)
    }
    initialPosition.current = newTime
  }

  const seekToFrame = (newFrame) => {
    const newTime = newFrame / frameRate
    seekToTime(newTime)
  }

  const handleScrub = (newFrame) => {
    videoRef.current?.pause()
    seekToFrame(newFrame)
  }

  // When user pauses the video
  // We need to land on the frame that was paused at
  // (this is a hack to ensure reported position is accurate)

  const handlePause = () => {
    initialPosition.current = videoRef.current?.currentTime
    seekToTime(initialPosition.current)
    setTimeout(() => {
      if (videoRef.current?.paused) {
        seekToTime(initialPosition.current)
        console.debug('VideoPlayer: Paused')
        setIsPlaying(false)
      }
    }, 10)
  }

  // User reached the end of the video
  // if loop mode is enabled, start over

  const handleEnded = () => {
    if (!isPlaying) {
      if (loop) videoRef.current.currentTime = 0
      return
    }
    if (loop) {
      console.debug('VideoPlayer: Ended, looping')
      videoRef.current.currentTime = 0
      videoRef.current.play()
    } else {
      console.debug('VideoPlayer: Ended, not looping')
      setIsPlaying(false)
    }
  }

  // User clicked play/pause button

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

  //
  // Render
  //

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
