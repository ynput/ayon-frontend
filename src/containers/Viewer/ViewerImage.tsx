import { FC, useRef, useState, useEffect, CSSProperties } from 'react'
import { Image } from './Viewer.styled'
import { useViewer } from '@context/ViewerContext'
import styled, { keyframes } from 'styled-components'
import { AnnotationsContainerDimensions } from './'
import { Icon } from '@ynput/ayon-react-components'

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const LoadingIcon = styled(Icon)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${spin} 1s linear infinite;
  z-index: 1;
`

const AnnotationsContainer = styled.div`
  position: absolute;
  inset: 0;
`

interface ViewerImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  reviewableId: string
  src: string
  alt: string
}

const ViewerImage: FC<ViewerImageProps> = ({ reviewableId, src, alt, ...props }) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [containerDims, setContainerDims] = useState<AnnotationsContainerDimensions | null>(null)
  const [parentDims, setParentDims] = useState<{ width: number; height: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const measureRef = useRef<HTMLDivElement>(null)
  const loadAttemptRef = useRef(0)

  // Safely mark the image as loaded and capture its intrinsic dimensions.
  // `attemptId` is used to ignore stale async events from previous `src` values.
  const setLoadedFromImage = (image: HTMLImageElement, attemptId?: number) => {
    if (attemptId && attemptId !== loadAttemptRef.current) {
      // This load callback is from an earlier attempt; ignore it.
      return
    }

    // If the image has natural size info, store it for annotation scaling.
    if (image.naturalWidth && image.naturalHeight) {
      setContainerDims({ width: image.naturalWidth, height: image.naturalHeight })
    }

    // Hide the loading indicator and show the image.
    setIsLoading(false)
  }

  useEffect(() => {
    // Increment an attempt identifier so we can ignore handlers from
    // previous `src` values that may fire after a rapid change.
    const attemptId = loadAttemptRef.current + 1
    loadAttemptRef.current = attemptId

    // If there's no src, short-circuit and clear loading state.
    if (!src) {
      setContainerDims(null)
      setIsLoading(false)
      return
    }

    // Begin a new load attempt: reset dims and show loading indicator.
    setIsLoading(true)
    setContainerDims(null)

    // Internal guards and timers to ensure we only resolve once per attempt.
    let resolved = false
    const image = imageRef.current

    let frame = 0
    let completeCheckInterval = 0
    let watchdogTimeout = 0

    // Resolve only once and clean up timers/listeners.
    const resolveOnce = (resolver: () => void) => {
      if (resolved || attemptId !== loadAttemptRef.current) return
      resolved = true
      cancelAnimationFrame(frame)
      window.clearInterval(completeCheckInterval)
      window.clearTimeout(watchdogTimeout)
      resolver()
    }

    // Check whether the image reports itself as complete (useful for cached images).
    const checkComplete = () => {
      if (!image || attemptId !== loadAttemptRef.current) return

      if (image.complete && image.currentSrc) {
        resolveOnce(() => setLoadedFromImage(image, attemptId))
      }
    }

    // Event handlers for normal load/error events.
    const onLoad = () => resolveOnce(() => image && setLoadedFromImage(image, attemptId))
    const onError = () => resolveOnce(() => setIsLoading(false))

    if (image) {
      image.addEventListener('load', onLoad)
      image.addEventListener('error', onError)

      // Try `decode()` when available for a reliable promise-based ready signal.
      if (typeof image.decode === 'function') {
        image
          .decode()
          .then(() => {
            resolveOnce(() => setLoadedFromImage(image, attemptId))
          })
          .catch(() => {
            // If decode fails, fall back to the complete check above.
            checkComplete()
          })
      }
    }

    // Single RAF check and periodic polling to catch odd browser states
    // (cached images or missed events). Poll interval is small to be responsive.
    frame = requestAnimationFrame(checkComplete)
    completeCheckInterval = window.setInterval(checkComplete, 250)

    // Watchdog: ensure loading can't remain forever. Force-resolve after 10s.
    watchdogTimeout = window.setTimeout(() => {
      resolveOnce(() => {
        if (image) {
          setLoadedFromImage(image, attemptId)
        } else {
          setIsLoading(false)
        }
      })
    }, 10000)

    // Cleanup listeners and timers when the effect reruns or unmounts.
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(completeCheckInterval)
      window.clearTimeout(watchdogTimeout)

      if (image) {
        image.removeEventListener('load', onLoad)
        image.removeEventListener('error', onError)
      }
    }
  }, [src])

  useEffect(() => {
    if (!measureRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setParentDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(measureRef.current)
    return () => observer.disconnect()
  }, [])

  const {
    createToolbar,
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    isLoaded: isLoadedAnnotations,
  } = useViewer()

  const imageAspectRatio = containerDims
    ? (containerDims.width || 0) / (containerDims.height || 1)
    : 0
  const parentAspectRatio = parentDims ? parentDims.width / (parentDims.height || 1) : 0

  // If the images aspect ratio is less than the parent element aspect ratio then the width should be auto and height 100%.
  const useHeight = imageAspectRatio < parentAspectRatio
  const aspectRatio = `${containerDims?.width} / ${containerDims?.height}`

  const containerStyle: CSSProperties = {
    position: 'relative',
    aspectRatio,
    width: useHeight ? 'auto' : '100%',
    height: useHeight ? '100%' : 'auto',
  }

  return (
    <div
      ref={measureRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <AnnotationsEditorProvider
        backgroundRef={imageRef}
        containerDimensions={containerDims}
        pageNumber={1}
        id={reviewableId}
        src={src}
        mediaType="image"
      >
        <div style={containerStyle}>
          <ImageWrapper>
            {isLoading && <LoadingIcon icon="progress_activity" />}
            <Image
              key={src}
              ref={imageRef}
              src={src}
              alt={alt}
              {...props}
              style={{ ...props.style, visibility: isLoading ? 'hidden' : 'visible' }}
              onError={(event) => {
                if (event.currentTarget.getAttribute('src') === src) {
                  setIsLoading(false)
                }
                props.onError?.(event)
              }}
              onLoad={(event) => {
                const { target } = event
                const image = target as HTMLImageElement
                if (image.getAttribute('src') === src) {
                  setLoadedFromImage(image, loadAttemptRef.current)
                }
                props.onLoad?.(event)
              }}
            />
            {AnnotationsCanvas && isLoadedAnnotations && containerDims && !isLoading && (
              <AnnotationsContainer>
                <AnnotationsCanvas {...containerDims} />
              </AnnotationsContainer>
            )}
          </ImageWrapper>
        </div>
        {createToolbar()}
      </AnnotationsEditorProvider>
    </div>
  )
}

export default ViewerImage
