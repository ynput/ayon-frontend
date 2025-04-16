import { useEffect, useRef } from 'react'
import { Button, Spacer } from '@ynput/ayon-react-components'
import Timecode from './Timecode'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFullscreen } from '@state/viewer'

const VideoPlayerControls = ({
  /* playback controls */
  isPlaying,
  handlePlayPause,

  /* duration/position/seeking */
  currentFrame,
  seekToFrame,
  frameCount,

  /* toggles */
  showOverlay,
  setShowOverlay,
  loop,
  setLoop,
  muted,
  setMuted,
}) => {
  const dispatch = useDispatch()
  const fullscreen = useSelector((state) => state.viewer.fullscreen)
  const currentFrameRef = useRef(0)
  const frameCountRef = useRef(0)

  // Keep position and duration in refs
  // to avoid stale values in keypress events

  useEffect(() => {
    currentFrameRef.current = currentFrame
  }, [currentFrame])

  useEffect(() => {
    frameCountRef.current = frameCount
  }, [frameCount])

  // Navigation

  const handleGoToStart = () => {
    console.debug('VideoPlayerControls: Go to start')
    seekToFrame(0)
  }
  const handleGoToEnd = () => {
    console.debug('VideoPlayerControls: Go to end')
    seekToFrame(frameCountRef.current - 1)
  }

  const handleGoBack1 = () => {
    console.debug('VideoPlayerControls: Go back 1')
    let prevFrame = currentFrameRef.current - 1
    console.log('Current Frame:', currentFrameRef.current)
    if (prevFrame < 0) {
      prevFrame = loop ? frameCountRef.current - 1 : 0
    }
    console.log('Next Frame:', prevFrame)
    seekToFrame(prevFrame)
  }
  const handleGoForward1 = () => {
    console.debug('VideoPlayerControls: Go forward 1')
    console.log('Current Frame:', currentFrameRef.current)
    let nextFrame = currentFrameRef.current + 1
    if (nextFrame > frameCountRef.current - 1) {
      nextFrame = loop ? 0 : frameCountRef.current - 1
    }
    console.log('Next Frame:', nextFrame)
    seekToFrame(nextFrame)
  }

  const handleGoBack5 = () => {
    console.debug('VideoPlayerControls: Go back 5')
    let prevFrame = currentFrameRef.current - 5
    if (prevFrame < 0) {
      prevFrame = loop ? frameCountRef.current - prevFrame : 0
    }
    seekToFrame(prevFrame)
  }
  const handleGoForward5 = () => {
    console.debug('VideoPlayerControls: Go forward 5')
    let nextFrame = currentFrameRef.current + 5
    if (nextFrame > frameCountRef.current - 1) {
      nextFrame = loop ? nextFrame - frameCountRef.current : frameCountRef.current - 1
    }
    seekToFrame(nextFrame)
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
        { keys: ['f'], action: () => dispatch(toggleFullscreen()) },
        { keys: ['m'], action: () => setMuted(!muted) },
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
  }, [loop, muted])

  const handleFullscreen = () => {
    dispatch(toggleFullscreen())
  }

  return (
    <>
      <Timecode
        value={currentFrame || 0}
        maximum={frameCount - 1 || 0}
        onChange={seekToFrame}
        tooltip={'Current frame'}
        offset={1}
      />
      <Button
        value={!muted}
        onClick={() => setMuted(!muted)}
        icon={'volume_up'}
        selected={!muted}
        data-tooltip="Mute/Unmute"
        data-shortcut="M"
      />

      <Button
        selected={loop}
        onClick={() => setLoop(!loop)}
        icon="repeat"
        data-tooltip="Loop playback"
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
        onClick={handleFullscreen}
        icon={fullscreen ? 'fullscreen_exit' : 'fullscreen'}
        data-tooltip="Fullscreen"
        data-shortcut="F"
      />

      <Timecode value={frameCount} disabled tooltip={'Total frames'} />
    </>
  )
}

export default VideoPlayerControls
