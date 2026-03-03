import React, { useLayoutEffect, useRef } from 'react'

const VideoOverlay = ({ videoWidth, videoHeight, showOverlay, showStill, videoRef }) => {
  const canvasRef = useRef(null)
  const capturedFrameRef = useRef(null)

  // Capture the current video frame when showStill becomes true.
  // Stored in an offscreen canvas so it survives dimension changes
  // that would otherwise redraw from the new (still-loading) video.
  useLayoutEffect(() => {
    if (showStill) {
      const video = videoRef.current
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const offscreen = document.createElement('canvas')
        offscreen.width = video.videoWidth
        offscreen.height = video.videoHeight
        offscreen.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        capturedFrameRef.current = offscreen
      } else {
        capturedFrameRef.current = null
      }
    } else {
      capturedFrameRef.current = null
    }
  }, [showStill])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = videoWidth * dpr
    canvas.height = videoHeight * dpr
    ctx.scale(dpr, dpr)

    const drawOverlay = () => {
      ctx.clearRect(0, 0, videoWidth, videoHeight)
      if (showStill) {
        if (capturedFrameRef.current) {
          ctx.drawImage(capturedFrameRef.current, 0, 0, videoWidth, videoHeight)
        } else {
          // No captured frame (initial load) — fill black to hide loading flickers
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, videoWidth, videoHeight)
        }
      }

      if (!showOverlay) return

      // Draw safe area indicator
      const safeMargin = 0.05 // 5% margin
      ctx.setLineDash([])
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.strokeRect(
        videoWidth * safeMargin,
        videoHeight * safeMargin,
        videoWidth * (1 - 2 * safeMargin),
        videoHeight * (1 - 2 * safeMargin),
      )

      // Draw center cross
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(videoWidth / 2, 0)
      ctx.lineTo(videoWidth / 2, videoHeight)
      ctx.moveTo(0, videoHeight / 2)
      ctx.lineTo(videoWidth, videoHeight / 2)
      ctx.stroke()
    }

    drawOverlay()
  }, [videoWidth, videoHeight, showOverlay, showStill])

  return (
    <canvas
      ref={canvasRef}
      style={{
        outline: showOverlay ? '1px solid #cccccc' : 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
      }}
    />
  )
}

export default VideoOverlay