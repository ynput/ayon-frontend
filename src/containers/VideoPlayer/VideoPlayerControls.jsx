import { useEffect } from 'react'

import { Button, Spacer } from '@ynput/ayon-react-components'
import Timecode from './Timecode'

const VideoPlayerControls = ({
  videoRef,
  isPlaying,
  onFrameChange,
  currentTime,
  duration,
  frameRate,
  showOverlay,
  setShowOverlay,
  loop,
  setLoop,
}) => {
  const frameLength = 0.04 // TODO

  const handlePlayPause = () => {
    if (videoRef.current.paused) {
      videoRef.current.play()
    } else {
      videoRef.current.pause()
    }
  }

  const handleGoToStart = () => {
    const newFrame = 0
    console.debug('VideoPlayerControls: Go to start')
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }
  const handleGoToEnd = () => {
    console.debug('VideoPlayerControls: Go to end')
    const newFrame = videoRef.current.duration
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }

  const handleGoBack1 = () => {
    console.debug('VideoPlayerControls: Go back 1')
    const newFrame = Math.max(0, videoRef.current.currentTime - frameLength)
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }
  const handleGoForward1 = () => {
    console.debug('VideoPlayerControls: Go forward 1')
    const newFrame = Math.min(videoRef.current.duration, videoRef.current.currentTime + frameLength)
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }

  const handleGoBack5 = () => {
    console.debug('VideoPlayerControls: Go back 5')
    const newFrame = Math.max(0, videoRef.current.currentTime - 5 * frameLength)
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }
  const handleGoForward5 = () => {
    console.debug('VideoPlayerControls: Go forward 5')
    const newFrame = Math.min(
      videoRef.current.duration,
      videoRef.current.currentTime + 5 * frameLength,
    )
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }

  //
  // Keyboard shortcuts
  //

  useEffect(() => {
    const handleKeyDown = (e) => {
      // abort if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // check shortcut isn't inside an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // check shortcut isn't inside a contenteditable element
      if (e.target.isContentEditable) return

      const keyHandlers = [
        { shiftKeys: ['A'], action: handleGoToStart },
        { keys: ['j', '1'], shiftKeys: ['ArrowLeft'], action: handleGoBack5 },
        { keys: ['ArrowLeft', '3'], action: handleGoBack1 },
        { keys: [' ', 'k'], action: handlePlayPause },
        { keys: ['ArrowRight', '4'], action: handleGoForward1 },
        { keys: ['l', '2'], shiftKeys: ['ArrowRight'], action: handleGoForward5 },
        { shiftKeys: ['D'], action: handleGoToEnd },
      ]

      const keyHandler = keyHandlers.find((handler) => {
        if (e.shiftKey) {
          return handler.shiftKeys?.includes(e.key)
        } else {
          return handler.keys?.includes(e.key)
        }
      })

      if (keyHandler) {
        keyHandler.action()
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <>
      <Timecode
        value={currentTime}
        frameRate={frameRate}
        maximum={duration}
        onChange={(value) => {
          console.debug('VideoPlayerControls: TC Input Change time to', value)
          videoRef.current.currentTime = value
        }}
      />

      <Spacer />

      <Button
        icon="skip_previous"
        data-tooltip="Go to Start"
        data-shortcut="Shift + A"
        onClick={handleGoToStart}
      />

      <Button
        icon="keyboard_double_arrow_left"
        data-tooltip="Back 5 frames"
        data-shortcut="Shift + ←"
        onClick={handleGoBack5}
      />

      <Button
        icon="chevron_left"
        data-tooltip="Back 1 frame"
        data-shortcut="←"
        onClick={handleGoBack1}
      />

      <Button
        icon={isPlaying ? 'pause' : 'play_arrow'}
        data-tooltip={isPlaying ? 'Pause' : 'Play'}
        data-shortcut="Space or K"
        onClick={handlePlayPause}
      />

      <Button
        icon="chevron_right"
        data-tooltip="Forward 1 frame"
        data-shortcut="→"
        onClick={handleGoForward1}
      />

      <Button
        icon="keyboard_double_arrow_right"
        data-tooltip="Forward 5 frames"
        data-shortcut="Shift + →"
        onClick={handleGoForward5}
      />

      <Button
        icon="skip_next"
        data-tooltip="Go to End"
        data-shortcut="Shift + D"
        onClick={handleGoToEnd}
      />

      <Spacer />
      <Button
        selected={showOverlay}
        onClick={() => setShowOverlay(!showOverlay)}
        icon="grid_guides"
        data-tooltip="Show/hide grid overlay"
      />
      <Button
        selected={loop}
        onClick={() => setLoop(!loop)}
        icon="repeat"
        data-tooltip="Loop playback"
      />

      <Timecode value={duration} frameRate={frameRate} />
    </>
  )
}

export default VideoPlayerControls
