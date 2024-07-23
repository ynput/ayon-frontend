import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Canvas from '@components/Canvas'

const Trackbar = ({
  duration,
  currentTime,
  onScrub,
  markIn,
  markOut,
  bufferedRanges,
  frameRate,
  isPlaying,
}) => {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const numFrames = useMemo(() => Math.floor(duration * frameRate), [frameRate, duration])

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
      const start = (range.start / duration) * width
      const end = (range.end / duration) * width
      ctx.strokeStyle = primaryColor
      ctx.beginPath()
      ctx.moveTo(start, height)
      ctx.lineTo(end, height)
      ctx.stroke()
    }

    const frameWidth = numFrames >= width ? 2 : width / numFrames
    const handleWidth = Math.max(frameWidth, 2)

    //
    // Draw frame boundaries
    //

    if (numFrames < width) {
      for (let i = 1; i < numFrames; i++) {
        const x = (i / numFrames) * width
        ctx.strokeStyle = containerLowest
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    }

    //
    // Draw the handle
    //

    let currentFrame
    if (isPlaying) {
      // due to a slight delay, the currentFrame is rounded to the nearest frame
      // so it WILL show the last frame during playback
      currentFrame = Math.floor(currentTime * frameRate)
      if (currentFrame >= numFrames) {
        currentFrame = numFrames - 1
      }
    } else {
      currentFrame = Math.floor(currentTime * frameRate)
    }

    let progressX = 0
    // if (isPlaying) {
    //   // during playback, use the currentTime to have a smooth animation
    //   progressX = (currentTime / duration) * width
    // } else {
    progressX = currentFrame >= numFrames ? width : (currentFrame / numFrames) * width
    //}

    ctx.fillStyle = primaryContainer
    ctx.beginPath()
    ctx.fillRect(progressX - 1, 0, handleWidth, height)
    ctx.fill()

    if (handleWidth > 15) {
      // if the handle is wide enough, write the current frame number
      ctx.fillStyle = onPrimaryContainer
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(currentFrame + 1, progressX + 3, 16)
    }

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
  }, [currentTime, duration, markIn, markOut, isPlaying])

  // Events

  useEffect(() => {
    drawSlider()
  }, [currentTime, duration, markIn, markOut, isPlaying])

  // Dragging

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    let newTime = (x / rect.width) * duration
    if (newTime < 0) newTime = 0
    if (newTime >= duration) newTime = duration - 1 / frameRate
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
    const newTime = (x / rect.width) * duration
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
