import { useState, useEffect, useRef, MutableRefObject, RefObject } from 'react'

const useVideoPlayback = (
  videoRef: RefObject<HTMLVideoElement | null>,
  frameRate: number,
  isTransitioning: MutableRefObject<boolean>,
) => {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const frameCallbackRef = useRef<(() => void) | null>(null)

  const currentFrame = Math.round(currentTime * frameRate)
  const frameCount = Math.round(duration * frameRate)

  // requestVideoFrameCallback loop to track currentTime
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateCurrentTime = (_now: number, metadataInfo: { mediaTime: number }) => {
      if (!isTransitioning.current) {
        setCurrentTime(metadataInfo.mediaTime)
      }
      if (!videoRef.current) return

      if (typeof frameCallbackRef.current === 'function') {
        frameCallbackRef.current()
      }

      frameCallbackRef.current = (videoRef.current as any).requestVideoFrameCallback(
        updateCurrentTime,
      )
    }

    if (typeof frameCallbackRef.current === 'function') {
      frameCallbackRef.current()
    }

    frameCallbackRef.current = (video as any).requestVideoFrameCallback(updateCurrentTime)

    return () => {
      if (typeof frameCallbackRef.current === 'function') {
        frameCallbackRef.current()
        frameCallbackRef.current = null
      }
    }
  }, []) // video element is never unmounted

  // Sync duration when it becomes available
  useEffect(() => {
    if (!videoRef.current) return
    const actualDuration = videoRef.current.duration
    if (actualDuration !== duration) {
      setDuration(actualDuration)
    }
  }, [videoRef, isPlaying, duration])

  return {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    currentFrame,
    frameCount,
  }
}

export default useVideoPlayback
