import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

import VideoOverlay from './VideoOverlay'
import Trackbar from './Trackbar'
import VideoPlayerControls from './VideoPlayerControls'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
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

  const [videoDimensions, setVideoDimensions] = useState({
    width: null,
    height: null,
  })

  //
  // Video size handling
  //

  useEffect(() => {
    if (!videoRowRef.current || showStill) return

    const updateVideoDimensions = () => {
      // DO NOT TOUCH THAT *0.95 ! IT'S AN IMPORTANT MAGIC!
      // Screw you, magic numbers! I'm changing it to 0.999
      //
      // For some reason, this seems to be the sweetspot
      // Going under 2 px behaves weird
      const clientWidth = videoRowRef.current?.clientWidth - 2
      const clientHeight = videoRowRef.current?.clientHeight - 2

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
      setIsPlaying(!videoRef.current?.paused)
      setBufferedRanges([])
    }

    const handleCanPlay = () => {
      console.debug('VideoPlayer: Can play now.')
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

  const handleLoad = () => {
    console.debug('VideoPlayer: handleLoad')
    setIsPlaying(false)
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
      setCurrentTime(newTime)
    } else {
      console.debug('VideoPlayer: Waiting for canplay event.')
      const onCanPlay = () => {
        videoElement.currentTime = newTime
        setCurrentTime(newTime)
        videoElement.removeEventListener('canplay', onCanPlay)
      }
      videoElement.addEventListener('canplay', onCanPlay)
    }
  }

  const handleScrub = (newTime) => {
    videoRef.current?.pause()
    seekToTime(newTime)
    initialPosition.current = newTime
  }

  const handlePause = () => {
    initialPosition.current = videoRef.current?.currentTime
    setTimeout(() => {
      if (videoRef.current?.paused) {
        console.debug('VideoPlayer: Paused')
        setIsPlaying(false)
      }
    }, 100)
  }

  const handleEnded = () => {
    if (loop && isPlaying) {
      console.debug('VideoPlayer: Ended, looping')
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
            onProgress={handleProgress}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={handlePause}
            onLoadedData={handleLoad}
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
            initialPosition.current = newFrame
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
          message={'Unable to load video.'}
          error={loadError?.code !== 4 && loadError?.message}
        />
      )}
    </VideoPlayerContainer>
  )
}

export default VideoPlayer
