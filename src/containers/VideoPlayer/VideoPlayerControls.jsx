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
    videoRef.current.currentTime = 0
  }
  const handleGoToEnd = () => {
    videoRef.current.currentTime = videoRef.current.duration
  }

  const handleGoBack1 = () => {
    const newFrame = Math.max(0, videoRef.current.currentTime - frameLength)
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }
  const handleGoForward1 = () => {
    const newFrame = Math.min(videoRef.current.duration, videoRef.current.currentTime + frameLength)
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }

  const handleGoBack5 = () => {
    const newFrame = Math.max(0, videoRef.current.currentTime - 5 * frameLength)
    videoRef.current.currentTime = newFrame
    onFrameChange(newFrame)
  }
  const handleGoForward5 = () => {
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
      // abort when shift key is pressed
      if (e.shiftKey) return

      // check shortcut isn't inside an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // check shortcut isn't inside a contenteditable element
      if (e.target.isContentEditable) return

      const keyHandlers = [
        { keys: [' ', 'k'], action: handlePlayPause },
        { keys: ['ArrowLeft'], action: handleGoBack1 },
        { keys: ['ArrowRight'], action: handleGoForward1 },
        { keys: ['a'], action: handleGoToStart },
        { keys: ['s'], action: handleGoToEnd },
        { keys: ['j'], action: handleGoBack5 },
        { keys: ['l'], action: handleGoForward5 },
      ]

      const keyHandler = keyHandlers.find((handler) => handler.keys.includes(e.key))

      if (keyHandler) {
        keyHandler.action()
        e.preventDefault()
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
          videoRef.current.currentTime = value
        }}
      />

      <Spacer />

      <Button icon="skip_previous" tooltip="Go to Start" onClick={handleGoToStart} />

      <Button
        icon="keyboard_double_arrow_left"
        tooltip="Go back 5 frames"
        onClick={handleGoBack5}
      />

      <Button icon="chevron_left" tooltip="Go back 1 frame" onClick={handleGoBack1} />

      <Button
        icon={isPlaying ? 'pause' : 'play_arrow'}
        tooltip={isPlaying ? 'Pause' : 'Play'}
        onClick={handlePlayPause}
      />

      <Button icon="chevron_right" tooltip="Go forward 1 frame" onClick={handleGoForward1} />

      <Button
        icon="keyboard_double_arrow_right"
        tooltip="Go forward 5 frames"
        onClick={handleGoForward5}
      />

      <Button icon="skip_next" tooltip="Go to End" onClick={handleGoToEnd} />

      <Spacer />
      <Button
        selected={showOverlay}
        onClick={() => setShowOverlay(!showOverlay)}
        icon="grid_guides"
      />
      <Button selected={loop} onClick={() => setLoop(!loop)} icon="repeat" />

      <Timecode value={duration} frameRate={frameRate} />
    </>
  )
}

export default VideoPlayerControls
