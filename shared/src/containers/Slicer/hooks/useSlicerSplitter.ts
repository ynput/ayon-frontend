import { useLocalStorage } from '@shared/hooks'

export const SLICER_SPLITTER_STATE_KEY = 'slicer-splitter'
export const SLICER_SPLITTER_PANEL_CONFIG = {
  minSize: 2,
  size: 12,
}

const useSlicerSplitter = () => {
  const [slicerSize, setSlicerSize] = useLocalStorage<number[]>(SLICER_SPLITTER_STATE_KEY, [
    SLICER_SPLITTER_PANEL_CONFIG.size,
    100 - SLICER_SPLITTER_PANEL_CONFIG.size,
  ])

  const handleResizeEnd = (props: { sizes: number[] }) => {
    setSlicerSize(props.sizes)
  }

  return [slicerSize, handleResizeEnd] as const
}

export default useSlicerSplitter
