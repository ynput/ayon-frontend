import { useRef, useEffect, useState, useCallback } from 'react'
import Canvas from '/src/components/Canvas'

const Trackbar = ({
  duration,
  currentTime,
  onScrub,
  markIn,
  markOut,
  bufferedRanges,
}) => {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

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
    ctx.fillStyle = '#1C2026'
    ctx.fillRect(0, 0, width, height)

    // Draw the buffered ranges
    for (const range of bufferedRanges) {
      const start = (range.start / duration) * width
      const end = (range.end / duration) * width
      ctx.strokeStyle = '#885bff'
      ctx.beginPath()
      ctx.moveTo(start, 0)
      ctx.lineTo(end, 0)
      ctx.stroke()
    }

    let markInX = 0
    if (markIn) {
      markInX = (markIn / duration) * width
      ctx.strokeStyle = 'green'
      ctx.beginPath()
      ctx.moveTo(markInX, 0)
      ctx.lineTo(markInX, height)
      ctx.stroke()
    }

    let markOutX = width
    if (markOut) {
      markOutX = (markOut / duration) * width
      ctx.strokeStyle = 'red'
      ctx.beginPath()
      ctx.moveTo(markOutX, 0)
      ctx.lineTo(markOutX, height)
      ctx.stroke()
    }

    ctx.strokeStyle = markOutX > markInX ? '#0ed3fe' : 'red'
    ctx.beginPath()
    ctx.moveTo(markInX, height - 1)
    ctx.lineTo(markOutX, height - 1)
    ctx.stroke()

    // Draw the handle
    const progressWidth = (currentTime / duration) * width
    ctx.fillStyle = '#0ed3fe'
    ctx.beginPath()
    ctx.fillRect(progressWidth - 1, 0, 2, height)
    ctx.fill()
  }, [currentTime, duration, markIn, markOut])

  // Events

  useEffect(() => {
    drawSlider()
  }, [currentTime, duration, markIn, markOut])

  // Dragging

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * duration
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
    setIsDragging(true)
    handleMouseMove(e)
  }

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / rect.width) * duration
    onScrub(newTime)
  }

  return (
    <Canvas
      ref={canvasRef}
      style={{ 
        minHeight: 42, 
        maxHeight: 42, 
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

