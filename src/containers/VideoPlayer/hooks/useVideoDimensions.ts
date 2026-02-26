import { useState, useEffect, Dispatch, SetStateAction, RefObject } from 'react'

interface Dimensions {
  width: number | null
  height: number | null
}

interface ActualDimensions {
  width: number
  height: number
}

interface UseVideoDimensionsReturn {
  videoDimensions: Dimensions
  setVideoDimensions: Dispatch<SetStateAction<Dimensions>>
  actualVideoDimensions: ActualDimensions | null
  setActualVideoDimensions: Dispatch<SetStateAction<ActualDimensions | null>>
}

const useVideoDimensions = (
  videoRowRef: RefObject<HTMLDivElement | null>,
  aspectRatio: number,
  showStill: boolean,
): UseVideoDimensionsReturn => {
  const [videoDimensions, setVideoDimensions] = useState<Dimensions>({
    width: null,
    height: null,
  })
  const [actualVideoDimensions, setActualVideoDimensions] = useState<ActualDimensions | null>(null)

  useEffect(() => {
    if (!videoRowRef.current || showStill) return

    const updateVideoDimensions = () => {
      const clientWidth = videoRowRef.current?.clientWidth
      const clientHeight = videoRowRef.current?.clientHeight

      if (!clientWidth || !clientHeight) return

      if (clientWidth / clientHeight > aspectRatio) {
        const width = Math.round(clientHeight * aspectRatio)
        setVideoDimensions({ width, height: clientHeight })
      } else {
        const height = Math.round(clientWidth / aspectRatio)
        setVideoDimensions({ width: clientWidth, height })
      }
    }

    updateVideoDimensions()

    const resizeObserver = new ResizeObserver(updateVideoDimensions)
    resizeObserver.observe(videoRowRef.current)
    return () => {
      if (!videoRowRef.current) return
      resizeObserver.unobserve(videoRowRef.current)
    }
  }, [videoRowRef, aspectRatio, showStill])

  return {
    videoDimensions,
    setVideoDimensions,
    actualVideoDimensions,
    setActualVideoDimensions,
  }
}

export default useVideoDimensions
