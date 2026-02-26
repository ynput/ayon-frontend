import { useState, useEffect, useLayoutEffect, useRef, Dispatch, SetStateAction, MutableRefObject, RefObject } from 'react'

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
  { seekPreferredInitialPosition, setCurrentTime, initialPosition, onMetadataLoaded }: UseVideoSourceTransitionDeps,
) => {
  const pendingSourceRef = useRef<string | null>(null)
  const transitionGenRef = useRef(0)
  const rvfcIdRef = useRef<(() => void) | number | null>(null)
  const [transitionTick, setTransitionTick] = useState(0)

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

  // Event listeners for loadedmetadata and canplay
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

    const handleCanPlay = () => {
      // Guard: if a newer transition already started, this canplay is stale
      if (!isTransitioning.current) return
      const didSeek = seekRef.current()

      const revealVideo = () => {
        // Capture generation at the time reveal is requested
        const gen = transitionGenRef.current
        // Double rVFC: first confirms decode, second confirms it's paintable
        rvfcIdRef.current = (videoRef.current as any)?.requestVideoFrameCallback(() => {
          // Stale check: a newer transition may have started
          if (gen !== transitionGenRef.current) return
          rvfcIdRef.current = (videoRef.current as any)?.requestVideoFrameCallback(() => {
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

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('canplay', handleCanPlay)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('canplay', handleCanPlay)
      cancelRvfc(videoElement)
    }
  }, []) // video element is never unmounted

  // Step 1: When src changes, capture still + mark transitioning
  // The actual source swap is debounced so rapid version clicking only loads the final one
  useEffect(() => {
    console.debug('VideoPlayer: source changed to', src)
    if (!videoRef.current) return
    // Immediately: invalidate stale callbacks, show still, store pending source
    transitionGenRef.current += 1
    cancelRvfc(videoRef.current)
    isTransitioning.current = true
    pendingSourceRef.current = src
    setShowStill(true)
    setCurrentTime(initialPosition.current)

    // Debounce: only trigger the actual source swap after rapid clicking settles
    const debounce = setTimeout(() => {
      setTransitionTick((t) => t + 1)
    }, 150)

    return () => clearTimeout(debounce)
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

  return { actualSource, showStill, setShowStill }
}

export default useVideoSourceTransition
