interface VideoFrameCallbackMetadata {
  mediaTime: number
  presentationTime: number
  expectedDisplayTime: number
  width: number
  height: number
  presentedFrames: number
}

type VideoFrameCallback = (now: number, metadata: VideoFrameCallbackMetadata) => void
type CancelVideoFrameCallback = () => void

/**
 * Detects if the browser supports requestVideoFrameCallback natively
 * @returns true if supported, false otherwise
 */
const isRequestVideoFrameCallbackSupported = (): boolean => {
  if (typeof HTMLVideoElement === 'undefined') return false
  
  const video = document.createElement('video')
  return typeof video.requestVideoFrameCallback === 'function'
}

/**
 * Creates a polyfill for requestVideoFrameCallback if it's not available
 * @returns true if polyfill was created, false if native implementation exists
 */
const createVideoFrameCallbackPolyfill = (): boolean => {
  if (typeof window === 'undefined' || typeof HTMLVideoElement === 'undefined') {
    return false
  }
  
  if (isRequestVideoFrameCallbackSupported()) {
    return false
  }

  const getNow = (): number => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

  const getRequestAnimationFrame = (): (callback: FrameRequestCallback) => number => {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame
    }
    if (typeof window !== 'undefined') {
      return (window.requestAnimationFrame ||
             (window as any).webkitRequestAnimationFrame ||
             (window as any).mozRequestAnimationFrame ||
             (window as any).oRequestAnimationFrame ||
             (window as any).msRequestAnimationFrame) as (callback: FrameRequestCallback) => number
    }
    return (callback: FrameRequestCallback) => setTimeout(callback, 16) // ~60fps
  }

  const getCancelAnimationFrame = (): (handle: number) => void => {
    if (typeof cancelAnimationFrame === 'function') {
      return cancelAnimationFrame
    }
    if (typeof window !== 'undefined') {
      return (window.cancelAnimationFrame ||
             (window as any).webkitCancelAnimationFrame ||
             (window as any).mozCancelAnimationFrame ||
             (window as any).oCancelAnimationFrame ||
             (window as any).msCancelAnimationFrame) as (handle: number) => void
    }
    return (handle: number) => clearTimeout(handle)
  }

  try {
    (HTMLVideoElement.prototype as any).requestVideoFrameCallback = function(callback: VideoFrameCallback): CancelVideoFrameCallback {
      if (typeof callback !== 'function') {
        throw new Error('requestVideoFrameCallback requires a callback function')
      }
      
      const video = this
      let rafId: number | null = null
      let lastTime = 0
      let isCancelled = false
      let frameCount = 0
      
      const raf = getRequestAnimationFrame()
      const caf = getCancelAnimationFrame()

      const tick = (): void => {
        if (isCancelled) return
        
        try {
          const now = getNow()
          const mediaTime = video.currentTime
          
          if (!video.paused && mediaTime !== lastTime) {
            frameCount++
            const metadataInfo: VideoFrameCallbackMetadata = {
              mediaTime: mediaTime,
              presentationTime: now,
              expectedDisplayTime: now,
              width: video.videoWidth,
              height: video.videoHeight,
              presentedFrames: frameCount
            }
            
            callback(now, metadataInfo)
            lastTime = mediaTime
          }
          
          if (!isCancelled) {
            rafId = raf(tick)
          }
        } catch (error) {
          console.warn('Error in requestVideoFrameCallback polyfill:', error)
          if (!isCancelled) {
            rafId = raf(tick)
          }
        }
      }

      rafId = raf(tick)

      const cancelFunction = (): void => {
        console.log('🎬 Video Polyfill: Canceling video frame callback')
        isCancelled = true
        if (rafId) {
          caf(rafId)
          rafId = null
        }
      }
      
      return cancelFunction
    }

    return true
  } catch (error) {
    return false
  }
}

const polyfillCreated = createVideoFrameCallbackPolyfill()

export {
  createVideoFrameCallbackPolyfill,
  isRequestVideoFrameCallbackSupported,
  polyfillCreated,
  type VideoFrameCallback,
  type VideoFrameCallbackMetadata,
  type CancelVideoFrameCallback
}
