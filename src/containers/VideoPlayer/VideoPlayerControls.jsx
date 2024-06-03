import { useEffect, useCallback, useRef } from 'react'

import { Button } from '@ynput/ayon-react-components'
import Timecode from './Timecode'

const VideoPlayerControls = ({ 
  videoRef, 
  isPlaying,
  currentTime,
  duration,
  frameRate,
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
    videoRef.current.currentTime -= frameLength
  }
  const handleGoForward1 = () => {
    videoRef.current.currentTime += frameLength
  }

  const handleGoBack5 = () => {
    videoRef.current.currentTime -= 5 * frameLength
  }
  const handleGoForward5 = () => {
    videoRef.current.currentTime += 5 * frameLength
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

      switch (e.key) {
        // Idiomatically play/pause with space
        case ' ':
          handlePlayPause()
          e.preventDefault()
          break
        case 'ArrowLeft':
          handleGoBack1()
          e.preventDevault()
          break
        case 'ArrowRight':
          handleGoForward1()
          e.preventDefault()
          break

        // Go to start/end
        case 'a':
          handleGoToStart()
          break
        case 's':
          handleGoToEnd()
          break

        // Fast seek
        case 'j':
          handleGoBack5()
          break
        case 'k':
          handlePlayPause()
          break
        case 'l':
          handleGoForward5()
          break

        // Avid-style seeking
        case '1':
          handleGoBack5()
          break
        case '2':
          handleGoForward5()
          break
        case '3':
          handleGoBack1()
          break
        case '4':
          handleGoForward1()
          break

        default:
          break
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

      <div style={{ flex: 1 }} />
   
      <Button
        icon="skip_previous"
        tooltip="Go to Start"
        onClick={handleGoToStart}
      />
   
      <Button
        icon="keyboard_double_arrow_left"
        tooltip="Go back 5 frames"
        onClick={handleGoBack5}
      />

      <Button
        icon="chevron_left"
        tooltip="Go back 1 frame"
        onClick={handleGoBack1}
      />

      <Button
        icon={isPlaying ? 'pause' : 'play_arrow'}
        tooltip={isPlaying ? 'Pause' : 'Play'}
        onClick={handlePlayPause}
      />

      <Button
        icon="chevron_right"
        tooltip="Go forward 1 frame"
        onClick={handleGoForward1}
      />

      <Button
        icon="keyboard_double_arrow_right"
        tooltip="Go forward 5 frames"
        onClick={handleGoForward5}
      />

      <Button icon="skip_next" tooltip="Go to End" onClick={handleGoToEnd} />

      <div style={{ flex: 1 }} />

      <Timecode value={duration} frameRate={frameRate} />

    </>

  )
}

export default VideoPlayerControls
