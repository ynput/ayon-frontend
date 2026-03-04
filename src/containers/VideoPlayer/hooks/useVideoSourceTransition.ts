import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  RefObject,
} from 'react'

interface MetadataPayload {
  duration: number
  dimensions: { width: number; height: number }
  actualDimensions: { width: number; height: number }
  isPaused: boolean
}

interface UseVideoSourceTransitionDeps {
  seekPreferredInitialPosition: () => boolean
  setCurrentTime: Dispatch<SetStateAction<number>>
  initialPosition: MutableRefObject<number>
  onMetadataLoaded: (payload: MetadataPayload) => void
}

const useVideoSourceTransition = (
  src: string,
  videoRef: RefObject<HTMLVideoElement | null>,
  isTransitioning: MutableRefObject<boolean>,
  {
    seekPreferredInitialPosition,
    setCurrentTime,
    initialPosition,
    onMetadataLoaded,
  }: UseVideoSourceTransitionDeps,
) => {
  const pendingSourceRef = useRef<string | null>(null)
  const transitionGenRef = useRef(0)
  const rvfcIdRef = useRef<(() => void) | number | null>(null)
  const [transitionToken, setTransitionToken] = useState(0)

  const [actualSource, setActualSource] = useState(src)
  const [showStill, setShowStill] = useState(false)

  // Keep a ref to seekPreferredInitialPosition to avoid stale closures in event listeners
  const seekRef = useRef(seekPreferredInitialPosition)
  seekRef.current = seekPreferredInitialPosition

  // Keep a ref to onMetadataLoaded to avoid stale closures
  const onMetadataLoadedRef = useRef(onMetadataLoaded)
  onMetadataLoadedRef.current = onMetadataLoaded

  const cancelRvfc = (videoElement: HTMLVideoElement | null) => {
    if (rvfcIdRef.current == null) return
    if (typeof rvfcIdRef.current === 'function') {
      rvfcIdRef.current()
    } else if ((videoElement as any)?.cancelVideoFrameCallback) {
      ;(videoElement as any).cancelVideoFrameCallback(rvfcIdRef.current)
    }
    rvfcIdRef.current = null
  }

  // Event listeners for metadata and earliest decodable frame readiness
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleLoadedMetadata = () => {
      console.debug('VideoPlayer: Metadata loaded. Duration: ', videoElement.duration)
      onMetadataLoadedRef.current({
        duration: videoElement.duration,
        dimensions: {
          width: videoElement.clientWidth,
          height: videoElement.clientHeight,
        },
        actualDimensions: {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
        },
        isPaused: videoElement.paused,
      })
    }

    const handleReadyForReveal = () => {
      // Guard: if a newer transition already started, this readiness event is stale
      if (!isTransitioning.current) return
      // If a newer source is pending, this readiness event is for an older
      // source — skip it so we don't prematurely clear the overlay
      if (pendingSourceRef.current) return
      const didSeek = seekRef.current()

      const revealVideo = () => {
        const gen = transitionGenRef.current
        const video = videoRef.current as any
        if (!video) return
        let didFinish = false
        let fallbackId: number | null = null
        let rafId1: number | null = null
        let rafId2: number | null = null

        const finishTransition = () => {
          if (didFinish) return
          didFinish = true
          if (fallbackId != null) {
            clearTimeout(fallbackId)
            fallbackId = null
          }
          if (rafId1 != null) {
            cancelAnimationFrame(rafId1)
            rafId1 = null
          }
          if (rafId2 != null) {
            cancelAnimationFrame(rafId2)
            rafId2 = null
          }
          if (gen !== transitionGenRef.current) return
          isTransitioning.current = false
          setShowStill(false)
        }

        const scheduleRafFallback = () => {
          rafId1 = requestAnimationFrame(() => {
            rafId2 = requestAnimationFrame(finishTransition)
          })
        }

        // Never wait long for one specific callback; prefer quick bounded reveal.
        fallbackId = window.setTimeout(finishTransition, 90)

        // Paused playback can miss rVFC on some engines, so rely on paint ticks.
        if (video.paused) {
          scheduleRafFallback()
          return
        }

        // First rVFC confirms the frame is decoded
        rvfcIdRef.current = video.requestVideoFrameCallback(() => {
          if (gen !== transitionGenRef.current) return
          // Playing: wait one more frame to confirm it's fully paintable.
          // If callbacks don't arrive, bounded fallback above will still reveal.
          rvfcIdRef.current = video.requestVideoFrameCallback(finishTransition)
        })
      }

      if (didSeek) {
        const gen = transitionGenRef.current
        const onSeeked = () => {
          if (gen !== transitionGenRef.current) return // stale seek from previous transition
          clearTimeout(seekFallback)
          revealVideo()
        }
        const seekFallback = window.setTimeout(() => {
          if (gen !== transitionGenRef.current) return
          videoRef.current?.removeEventListener('seeked', onSeeked)
          revealVideo()
        }, 250)
        videoRef.current?.addEventListener('seeked', onSeeked, { once: true })
      } else {
        revealVideo()
      }
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('loadeddata', handleReadyForReveal)
    videoElement.addEventListener('canplay', handleReadyForReveal)

    // Handle video loaded from cache before listeners were attached
    if (videoElement.readyState >= 1) {
      handleLoadedMetadata()
    }
    if (isTransitioning.current && videoElement.readyState >= 2) {
      handleReadyForReveal()
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('loadeddata', handleReadyForReveal)
      videoElement.removeEventListener('canplay', handleReadyForReveal)
      cancelRvfc(videoElement)
    }
  }, []) // video element is never unmounted

  // Step 1: When src changes, capture still + mark transitioning
  // useLayoutEffect ensures the overlay is up BEFORE the browser paints,
  // eliminating the timing gap that allows flash frames
  useLayoutEffect(() => {
    console.debug('VideoPlayer: source changed to', src)
    if (!videoRef.current) return
    // Immediately: invalidate stale callbacks, show still, store pending source
    transitionGenRef.current += 1
    cancelRvfc(videoRef.current)
    isTransitioning.current = true
    pendingSourceRef.current = src
    // Only show the still overlay if the video has a frame to capture.
    // On initial render readyState is 0 — showing still with no captured frame
    // would draw a black rectangle instead of the video.
    if (videoRef.current.readyState >= 2) {
      setShowStill(true)
    }
    setCurrentTime(initialPosition.current)

    // Trigger the actual source swap on the next render cycle.
    // This keeps the still overlay in place while avoiding artificial delays.
    setTransitionToken((t) => t + 1)
  }, [src])

  // Step 2: After React has committed the still overlay, swap the source synchronously
  // useLayoutEffect ensures the source swap happens before the browser paints,
  // eliminating the timing gap that causes flashes
  useLayoutEffect(() => {
    if (!pendingSourceRef.current) return
    const source = pendingSourceRef.current
    pendingSourceRef.current = null
    setActualSource(source)
  }, [transitionToken])

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
  }, [transitionToken])

  return { actualSource, showStill, setShowStill }
}

export default useVideoSourceTransition
