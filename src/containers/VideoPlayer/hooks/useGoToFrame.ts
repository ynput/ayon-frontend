import { useAppDispatch, useAppSelector } from '@state/store'
import { goToFrame, goToPosition } from '@state/viewer'
import { useEffect } from 'react'

type Props = {
  setCurrentTime: (frame: number) => void
  frameRate: number
  duration: number
  videoElement: HTMLVideoElement | null
}

const useGoToFrame = ({ setCurrentTime, frameRate, duration, videoElement }: Props) => {
  const dispatch = useAppDispatch()
  const frame = useAppSelector((state) => state.viewer.goToFrame)
  const position = useAppSelector((state) => state.viewer.goToPosition)

  useEffect(() => {
    // keep the request until the video is loaded (e.g. when opening the viewer)
    if (!videoElement || !duration) return

    let time: number
    if (frame !== null) {
      time = frame / frameRate
      dispatch(goToFrame(null))
    } else if (position !== null) {
      time = position * duration
      dispatch(goToPosition(null))
    } else {
      return
    }

    time = Math.max(0, Math.min(duration, time))
    videoElement.currentTime = time
    setCurrentTime(time)
  }, [frame, position, frameRate, duration, setCurrentTime, videoElement])
}

export default useGoToFrame
