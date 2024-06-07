import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

import VideoOverlay from './VideoOverlay'
import Trackbar from './Trackbar'
import VideoPlayerControls from './VideoPlayerControls'
import EmptyPlaceholder from '/src/components/EmptyPlaceholder/EmptyPlaceholder'
import { classNames } from 'primereact/utils'

const VideoPlayerContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;

  gap: 6px;

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
    gap: 6px;
    padding-bottom: 6px;
  }
`

const VideoPlayer = ({ src, frameRate, aspectRatio }) => {
  const videoRef = useRef(null)
  const videoRowRef = useRef(null)

  const [preferredInitialPosition, setPreferredInitialPosition] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bufferedRanges, setBufferedRanges] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [actualSource, setActualSource] = useState(src)

  const [showStill, setShowStill] = useState(false)

  const [showOverlay, setShowOverlay] = useState(false)
  const [loop, setLoop] = useState(true)

  const [videoDimensions, setVideoDimensions] = useState({
    width: 600,
    height: 400,
  })

  useEffect(() => {
    if (!videoRowRef.current) return

    const updateVideoDimensions = () => {
      // DO NOT TOUCH THAT *0.95 ! IT'S AN IMPORTANT MAGIC!
      // Screw you, magic numbers! I'm changing it to 0.999
      //
      // For some reason, this seems to be the sweetspot
      // Going under 2 px behaves weird
      const clientWidth = videoRowRef.current.clientWidth - 2
      const clientHeight = videoRowRef.current.clientHeight - 2

      if (clientWidth / clientHeight > aspectRatio) {
        const width = clientHeight * aspectRatio
        const height = clientHeight
        setVideoDimensions({ width, height })
      } else {
        const width = clientWidth
        const height = clientWidth / aspectRatio
        setVideoDimensions({ width, height })
      }
    }

    const resizeObserver = new ResizeObserver(updateVideoDimensions)
    resizeObserver.observe(videoRowRef.current)
    return () => {
      if (!videoRowRef.current) return
      resizeObserver.unobserve(videoRowRef.current)
    }
  }, [videoRowRef])

  useEffect(() => {
    console.log('src changed', src)
    if (!videoRef.current) return
    setShowStill(true)
    setTimeout(() => setActualSource(src), 20)
  }, [src, videoRef])

  useEffect(() => {
    if (!videoRef.current) return
    const frameLength = frameRate ? 1 / frameRate : 0.04
    const updateTime = () => {
      const actualDuration = videoRef.current.duration
      if (actualDuration !== duration) {
        setDuration(actualDuration)
      }
      const actualTime = Math.min(videoRef.current?.currentTime || 0, actualDuration - frameLength)
      if (isPlaying) {
        setCurrentTime(actualTime)
        setTimeout(() => requestAnimationFrame(updateTime), 40)
      } else {
        setCurrentTime(actualTime)
      }
    }
    updateTime()
  }, [videoRef, isPlaying, duration])

  const handleLoad = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setBufferedRanges([])
    setLoadError(null)
    // after a short delay, hide the still image
    setTimeout(() => setShowStill(false), 100)
  }

  const handleCanPlay = () => {
    // Sets the current time of the video to a preferred initial position.
    // When the video is loaded, it will start playing from this position.
    if (preferredInitialPosition >= videoRef.current.duration) return
    if (isNaN(preferredInitialPosition)) return
    if (videoRef.current.currentTime > 0 || preferredInitialPosition === 0) return
    if (videoRef.current.currentTime === preferredInitialPosition) return

    setCurrentTime(preferredInitialPosition)
    videoRef.current.currentTime = preferredInitialPosition
  }

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration)
    const width = videoRef.current.clientWidth
    const height = videoRef.current.clientHeight
    setVideoDimensions({ width, height })
    setIsPlaying(!videoRef.current.paused)
    setBufferedRanges([])
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

  const handleScrub = (newTime) => {
    videoRef.current.pause()
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
    setPreferredInitialPosition(newTime)
  }

  const handlePause = () => {
    setPreferredInitialPosition(videoRef.current.currentTime)
    setTimeout(() => {
      if (videoRef.current.paused) {
        console.log('Paused')
        setIsPlaying(false)
      }
    }, 100)
  }

  const handleEnded = () => {
    if (loop && isPlaying) {
      console.log('Ended, looping')
      videoRef.current.currentTime = 0
      videoRef.current.play()
    } else {
      console.log('Ended, not looping')
      setIsPlaying(false)
    }
  }

  const handleLoadError = (e) => {
    // check if the video is 404
    const code = e.target.error.code
    if (code === 4) {
      setLoadError({ code, message: 'No preview for this version' })
    } else {
      setLoadError({ code, message: 'Error loading video' })
    }

    setShowStill(false)
  }

  return (
    <VideoPlayerContainer>
      <div
        className={classNames('video-row video-container', { 'no-content': loadError })}
        ref={videoRowRef}
      >
        <div
          className="video-wrapper"
          style={{ width: videoDimensions.width, height: videoDimensions.height }}
        >
          <video
            ref={videoRef}
            width={videoDimensions.width}
            height={videoDimensions.height}
            src={actualSource}
            onLoadedMetadata={handleLoadedMetadata}
            onProgress={handleProgress}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={handlePause}
            onLoadedData={handleLoad}
            onCanPlay={handleCanPlay}
            onError={handleLoadError}
          />
          <VideoOverlay
            videoWidth={videoDimensions.width}
            videoHeight={videoDimensions.height}
            showOverlay={showOverlay}
            showStill={showStill}
            videoRef={videoRef}
          />
        </div>
      </div>

      <div className="trackbar-row">
        <Trackbar
          currentTime={currentTime}
          duration={duration}
          bufferedRanges={bufferedRanges}
          onScrub={handleScrub}
          frameRate={frameRate}
        />
      </div>

      <div className="controls-row">
        <VideoPlayerControls
          videoRef={videoRef}
          isPlaying={isPlaying}
          onFrameChange={(newFrame) => {
            setCurrentTime(newFrame)
            setPreferredInitialPosition(newFrame)
          }}
          currentTime={currentTime}
          duration={duration}
          frameRate={frameRate}
          {...{ showOverlay, setShowOverlay, loop, setLoop }}
        />
      </div>
      {loadError && (
        <EmptyPlaceholder
          icon="hide_image"
          message={'This version has no previewable content.'}
          error={loadError?.code !== 4 && loadError?.message}
        />
      )}
    </VideoPlayerContainer>
  )
}

export default VideoPlayer
