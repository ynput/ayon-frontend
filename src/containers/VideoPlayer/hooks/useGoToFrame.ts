import { useAppDispatch, useAppSelector } from '@state/store'
import { goToFrame } from '@state/viewer'
import { useEffect } from 'react'

type Props = {
  setCurrentTime: (frame: number) => void
  frameRate: number
  duration: number
  videoElement: HTMLVideoElement
}

const useGoToFrame = ({ setCurrentTime, frameRate, duration, videoElement }: Props) => {
  const dispatch = useAppDispatch()
  const frame = useAppSelector((state) => state.viewer.goToFrame)

  useEffect(() => {
    if (frame !== null) {
      const time = Math.max(0, Math.min(duration, frame / frameRate))
      videoElement.currentTime = time
      setCurrentTime(time)
      dispatch(goToFrame(null))
    }
  }, [frame, frameRate, duration, setCurrentTime])
}

export default useGoToFrame
