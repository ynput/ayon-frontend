import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Canvas from '@components/Canvas'

// Function to draw a rounded rectangle
function drawRoundedRect(ctx, { x, y, width, height, radius }) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.fill()
}

const drawFrameNumber = (ctx, { color, bg, currentFrame, progressX, handleWidth }) => {
  const text = currentFrame + 1
  ctx.font = '10px monospace'
  ctx.textAlign = 'left'

  // Calculate the width and height of the text
  const textMetrics = ctx.measureText(text)
  const textWidth = textMetrics.width
  const textHeight = 10 // Since we know the font size is 10px
  const textY = textHeight
  let textX = progressX + handleWidth / 2 - textWidth / 2

  const paddingX = 4
  const paddingY = 1
  const borderRadius = 4
  // Define the background rectangle's dimensions
  const bgWidth = textWidth + 2 * paddingX
  const bgHeight = textHeight + 2 * paddingY
  let bgX = textX - paddingX
  const bgY = textY - textHeight

  const ctxWidth = ctx.canvas.width
  // move frame number to the left so it's not cut off
  if (bgWidth + bgX > ctxWidth) {
    textX = ctxWidth - textWidth - paddingX
    bgX = textX - paddingX
  } else if (bgX < 0) {
    textX = 0 + paddingX
    bgX = textX - paddingX
  }

  // Draw the background rectangle
  ctx.fillStyle = bg // Replace with your desired background color
  drawRoundedRect(ctx, { x: bgX, y: bgY, width: bgWidth, height: bgHeight, radius: borderRadius })

  // Draw the text on top of the background
  ctx.fillStyle = color
  ctx.fillText(text, textX, textY)
}

const highlightFrame = (ctx, { color, progressX, handleWidth, height }) => {
  // max 4, min 2, depending on the width of the frame
  const dotRadius = Math.min(Math.max(handleWidth / 2, 2), 4)
  // Draw blue dot in the middle of handle
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(progressX + handleWidth / 2, height / 2, dotRadius, 0, 2 * Math.PI)
  ctx.fill()
}

const Trackbar = ({
  frameCount,
  currentFrame,
  onScrub,
  markIn,
  markOut,
  bufferedRanges,
  frameRate,
  isPlaying,
  highlighted,
}) => {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const height = 32
  const primaryColor = '#8fceff'
  const primaryContainer = '#1c4154',
    onPrimaryContainer = '#ebf5ff'
  const containerLow = '#1c2026'
  const containerLowest = '#16191d'

  // DRAW

  const drawSlider = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const width = ctx.canvas.width
    const height = ctx.canvas.height

    // Clear the canvas
    ctx.clearRect(0, 0, width, height)

    // Draw the background of the slider
    ctx.fillStyle = containerLow
    ctx.fillRect(0, 0, width, height)

    // Draw the buffered ranges
    for (const range of bufferedRanges) {
      const start = (range.start / frameCount) * width
      const end = (range.end / frameCount) * width
      ctx.strokeStyle = primaryColor
      ctx.beginPath()
      ctx.moveTo(start, height)
      ctx.lineTo(end, height)
      ctx.stroke()
    }

    const frameWidth = frameCount >= width ? 2 : width / frameCount
    const handleWidth = Math.max(frameWidth, 2)

    //
    // Draw frame boundaries
    //

    if (frameCount < width) {
      for (let i = 1; i < frameCount; i++) {
        const x = (i / frameCount) * width
        ctx.strokeStyle = containerLowest
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()

        // if the frame is highlighted (like an annotation)
        if (highlighted && highlighted.includes(i)) {
          // Calculate progressX for the current frame
          const progressX = ((i - 1) / frameCount) * width
          highlightFrame(ctx, {
            color: primaryColor,
            progressX,
            handleWidth,
            height,
          })
        }
      }
    }

    //
    // Draw the handle
    //

    let progressX = 0
    progressX = currentFrame >= frameCount ? width : (currentFrame / frameCount) * width

    // Current frame handle
    ctx.fillStyle = primaryContainer
    ctx.beginPath()
    ctx.fillRect(progressX - 1, 0, handleWidth, height)
    ctx.fill()

    // draw blue dot if current frame is highlighted
    if (highlighted && highlighted.includes(currentFrame + 1)) {
      highlightFrame(ctx, {
        color: primaryColor,
        progressX,
        handleWidth,
        height,
      })
    }

    drawFrameNumber(ctx, {
      color: onPrimaryContainer,
      bg: primaryContainer,
      currentFrame,
      progressX,
      handleWidth,
    })

    //
    // Draw selection range
    //

    // let markInX = 0
    // if (markIn) {
    //   markInX = (markIn / duration) * width
    //   ctx.strokeStyle = 'green'
    //   ctx.beginPath()
    //   ctx.moveTo(markInX, 0)
    //   ctx.lineTo(markInX, height)
    //   ctx.stroke()
    // }

    // let markOutX = width
    // if (markOut) {
    //   markOutX = (markOut / duration) * width
    //   ctx.strokeStyle = 'red'
    //   ctx.beginPath()
    //   ctx.moveTo(markOutX, 0)
    //   ctx.lineTo(markOutX, height)
    //   ctx.stroke()
    // }

    // ctx.strokeStyle = markOutX > markInX ? '#0ed3fe' : 'red'
    // ctx.beginPath()
    // ctx.moveTo(markInX, height - 1)
    // ctx.lineTo(markOutX, height - 1)
    // ctx.stroke()
  }, [currentFrame, frameCount, markIn, markOut, isPlaying, highlighted, bufferedRanges, primaryColor, primaryContainer, onPrimaryContainer, containerLow, containerLowest])

  // Events

  useEffect(() => {
    drawSlider()
  }, [drawSlider])

  // Dragging

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    let newTime = (x / rect.width) * frameCount
    if (newTime < 0) newTime = 0
    if (newTime >= frameCount) newTime = frameCount - 1
    onScrub(newTime)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    handleMouseMove(e)
  }

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * frameCount
    onScrub(newTime)
  }

  return (
    <Canvas
      ref={canvasRef}
      style={{
        minHeight: height,
        maxHeight: height,
        cursor: 'pointer',
        flexGrow: 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDraw={drawSlider}
    />
  )
}

export default Trackbar
