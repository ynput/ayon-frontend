import { useState, useEffect, useRef, useMemo } from 'react'
import styled from 'styled-components'

import VideoOverlay from './VideoOverlay'
import Trackbar from './Trackbar'
import VideoPlayerControls from './VideoPlayerControls'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import clsx from 'clsx'
import useGoToFrame from './hooks/useGoToFrame'
import { useViewer } from '@context/viewerContext'

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

  const initialPosition = useRef(0)
  const seekedToInitialPosition = useRef(false)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bufferedRanges, setBufferedRanges] = useState([])
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

  const updateVeryTrueFrame = (now, metadataInfo) => {
    const actualTime = metadataInfo.mediaTime
    setCurrentTime(actualTime)
    // setVeryTrueFrame(Math.round(actualTime * frameRate) + 1)
    const video = videoRef.current
    // if (!video) {
    //   console.log('Video lost')
    //   return
    // }
    video.requestVideoFrameCallback(updateVeryTrueFrame)
  }

  useEffect(() => {
    if (!videoRef.current) return
    console.log('Got video')
    const video = videoRef.current
    video.requestVideoFrameCallback(updateVeryTrueFrame)
  }, [videoRef.current, frameRate])

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
      //console.debug('VideoPlayer: Can play now.')
      seekPreferredInitialPosition()
      setShowStill(false)
    }

    // Attach event listeners
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('canplay', handleCanPlay)

    // Cleanup event listeners on unmount
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('canplay', handleCanPlay)
    }
  }, [videoRef.current]) // Add videoRef.current as a dependency

  useEffect(() => {
    console.debug('VideoPlayer: source changed to', src)
    if (!videoRef.current) return
    // obscure the video element with a still image,
    // so the transition to the new video is not visible
    setShowStill(true)
    // Give the overlay some time to show up
    setTimeout(() => setActualSource(src), 20)
  }, [src, videoRef])

  const handleOnPlay = () => {
    onPlay && onPlay()
    setIsPlaying(true)
  }

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
    setCurrentTime(0)
    setBufferedRanges([])
    setLoadError(null)
    seekedToInitialPosition.current = false
  }

  const handleProgress = (e) => {
    // create a list of buffered time ranges
    const buffered = e.target.buffered
    if (!buffered.length) return
    const bufferedRanges = []
    for (var i = 0; i < buffered.length; i++) {
      const r = { start: buffered.start(i), end: buffered.end(i) }
      bufferedRanges.push(r)
    }
    setBufferedRanges(bufferedRanges)
  }

  //
  // Video position / currentTime handling
  //

  useEffect(() => {
    // CurrentTime updater
    // HTML video onTimeUpdate doesn't update fast enough to be super sleek
    // But we can query the currentTime much faster and have smooth timeline
    if (!videoRef.current) return
    const frameLength = frameRate ? 1 / frameRate : 0.04
    const updateTime = () => {
      const actualDuration = videoRef.current?.duration
      if (actualDuration !== duration) {
        setDuration(actualDuration)
      }
      // const actualTime = Math.min(videoRef.current?.currentTime || 0, actualDuration - frameLength)
      // if (isPlaying) {
      //   setCurrentTime(actualTime)
      //   setTimeout(() => requestAnimationFrame(updateTime), 10)
      // } else {
      //   setCurrentTime(actualTime)
      // }
    }
    updateTime()
  }, [videoRef, isPlaying, duration])

  const seekPreferredInitialPosition = () => {
    // This is called when verison is changed
    // It maintains the position of the video after switching
    // so the user can compare two frames

    if (seekedToInitialPosition.current) return
    const newTime = initialPosition.current

    if (newTime >= videoRef.current?.duration) return
    if (isNaN(newTime)) return

    if (videoRef.current?.currentTime > 0 || newTime === 0) {
      seekedToInitialPosition.current = true
      return
    }
    if (videoRef.current?.currentTime === newTime) {
      seekedToInitialPosition.current = true
      return
    }

    console.debug(
      'VideoPlayer: Setting initial position',
      newTime,
      'from',
      videoRef.current?.currentTime,
    )
    seekToTime(newTime)
    seekedToInitialPosition.current = true
  }

  const seekToTime = (newTime) => {
    const videoElement = videoRef.current
    if (videoElement.readyState >= 3) {
      // HAVE_FUTURE_DATA
      videoElement.currentTime = newTime
      // setCurrentTime(newTime)
    } else {
      //console.debug('VideoPlayer: Waiting for canplay event.')
      const onCanPlay = () => {
        videoElement.currentTime = newTime
        //setCurrentTime(newTime)
        videoElement.removeEventListener('canplay', onCanPlay)
      }
      videoElement.addEventListener('canplay', onCanPlay)
    }
  }

  const handleScrub = (newTime) => {
    if (newTime === videoRef.current?.currentTime) return
    videoRef.current?.pause()
    seekToTime(newTime)
    initialPosition.current = newTime
  }

  const handlePause = () => {
    // initialPosition.current = videoRef.current?.currentTime
    // seekToTime(initialPosition.current)
    // setTimeout(() => {
    //   if (videoRef.current?.paused) {
    //     seekToTime(initialPosition.current)
    //     console.debug('VideoPlayer: Paused')
    //     setIsPlaying(false)
    //   }
    // }, 10)
  }

  const handleEnded = () => {
    if (!isPlaying) {
      console.debug('ended, but not playing')
      console.debug('position: ', videoRef.current.currentTime)
      return
    }
    if (loop) {
      console.debug('VideoPlayer: Ended, looping', videoRef.current.currentTime)
      videoRef.current.currentTime = 0
      videoRef.current.play()
    } else {
      console.debug('VideoPlayer: Ended, not looping')
      setIsPlaying(false)
    }
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

  const handleMuteToggle = (value) => {
    setMuted(value)
    videoRef.current.muted = value
  }

  const currentFrame = Math.floor(videoRef.current?.currentTime * frameRate) + 1

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
          currentTime={currentTime}
          duration={duration}
          bufferedRanges={bufferedRanges}
          onScrub={handleScrub}
          frameRate={frameRate}
          isPlaying={isPlaying}
          highlighted={annotatedFrames}
        />
      </div>

      <div className="controls-row">
        <VideoPlayerControls
          videoRef={videoRef}
          isPlaying={isPlaying}
          onFrameChange={(newFrame) => {
            // setCurrentTime(newFrame)
            initialPosition.current = newFrame
          }}
          frameRate={frameRate}
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
