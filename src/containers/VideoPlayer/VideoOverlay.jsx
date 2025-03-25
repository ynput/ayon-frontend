import React, { useEffect, useRef } from 'react'

const VideoOverlay = ({ videoWidth, videoHeight, showOverlay, showStill, videoRef }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const drawOverlay = () => {
      const width = canvas.width
      const height = canvas.height
      ctx.clearRect(0, 0, width, height)

      if (showStill) {
        // Draw still frame
        ctx.drawImage(videoRef.current, 0, 0, width, height)
        // please let this here for now (debugging)
        // ctx.fillStyle = 'red'
        // ctx.rect(100, 100, 20, 20)
        // ctx.fill()
      }

      if (!showOverlay) return

      // Draw safe area indicator
      const safeMargin = 0.05 // 5% margin
      ctx.setLineDash([])
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.strokeRect(
        width * safeMargin,
        height * safeMargin,
        width * (1 - 2 * safeMargin),
        height * (1 - 2 * safeMargin),
      )

      // Draw center cross
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width / 2, height)
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
    }

    drawOverlay()
  }, [videoWidth, videoHeight, showOverlay, showStill])

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      style={{
        outline: showOverlay ? '1px solid #cccccc' : 'none',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  )
}

export default VideoOverlay
