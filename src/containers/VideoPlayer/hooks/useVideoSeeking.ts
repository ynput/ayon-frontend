import { useRef, Dispatch, SetStateAction, MutableRefObject, RefObject } from 'react'

interface UseVideoSeekingDeps {
  setIsPlaying: Dispatch<SetStateAction<boolean>>
}

const useVideoSeeking = (
  videoRef: RefObject<HTMLVideoElement | null>,
  frameRate: number,
  isTransitioning: MutableRefObject<boolean>,
  { setIsPlaying }: UseVideoSeekingDeps,
) => {
  const initialPosition = useRef(0) // in seconds
  const seekedToInitialPosition = useRef(false)

  const seekToTime = (newTime: number): boolean => {
    const videoElement = videoRef.current
    if (!videoElement) return false
    if (newTime === videoElement.currentTime) return false
    if (videoElement.readyState >= 1) {
      // HAVE_METADATA
      videoElement.currentTime = newTime
    } else {
      const onLoadedMetadata = () => {
        videoElement.currentTime = newTime
        videoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
      }
      videoElement.addEventListener('loadedmetadata', onLoadedMetadata)
    }
    initialPosition.current = newTime
    return true
  }

  const seekToFrame = (newFrame: number) => {
    const newTime = newFrame / frameRate
    seekToTime(newTime)
  }

  const seekPreferredInitialPosition = (): boolean => {
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
      return seekToTime(clampedTime)
    }

    return false
  }

  const handleScrub = (newFrame: number) => {
    videoRef.current?.pause()
    seekToFrame(newFrame)
  }

  const handlePause = () => {
    // Don't overwrite initialPosition during a transition — it holds the
    // user's position from the previous video, needed for seekPreferredInitialPosition
    if (isTransitioning.current) return
    const rawTime = videoRef.current?.currentTime
    if (rawTime == null) return
    initialPosition.current = Math.round(rawTime * frameRate) / frameRate
    seekToTime(initialPosition.current)
    setTimeout(() => {
      if (videoRef.current?.paused) {
        seekToTime(initialPosition.current)
        console.debug('VideoPlayer: Paused')
        setIsPlaying(false)
      }
    }, 10)
  }

  return {
    seekToTime,
    seekToFrame,
    handleScrub,
    handlePause,
    seekPreferredInitialPosition,
    initialPosition,
    seekedToInitialPosition,
  }
}

export default useVideoSeeking
