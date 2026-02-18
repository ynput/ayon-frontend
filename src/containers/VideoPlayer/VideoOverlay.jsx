import React, { useLayoutEffect, useRef } from 'react'

const VideoOverlay = ({ videoWidth, videoHeight, showOverlay, showStill, videoRef }) => {
  const canvasRef = useRef(null)

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
        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight)
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
