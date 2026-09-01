import { useSessionStorage } from '@shared/hooks/useSessionStorage'

export const SLICER_SPLITTER_STATE_KEY = 'slicer-splitter'
export const SLICER_SPLITTER_PANEL_CONFIG = {
  minSize: 2,
  size: 12,
}

const useSlicerSplitter = () => {
  const [slicerSize, setSlicerSize] = useSessionStorage<number[]>(SLICER_SPLITTER_STATE_KEY, [
    SLICER_SPLITTER_PANEL_CONFIG.size,
    100 - SLICER_SPLITTER_PANEL_CONFIG.size,
  ])

  const handleResizeEnd = (props: { sizes: number[] }) => {
    setSlicerSize(props.sizes)
  }

  return [slicerSize, handleResizeEnd] as const
}

// header plus a few rows; below this the stack grows and scrolls instead of crushing panels
export const SLICER_MIN_PANEL_HEIGHT = 180

// stacked slicer panels keep pixel heights, so enlarging one pushes the stack past the
// column height (scrolls) instead of shrinking its neighbours below the minimum
export const useSlicerPanelHeights = (
  page: string,
  panelCount: number,
  containerHeight: number,
) => {
  const [stored, setStoredHeights] = useSessionStorage<number[]>(
    `slicer-panel-heights-${page}`,
    [],
  )

  const heights: number[] =
    stored.length === panelCount
      ? stored.map((h) => Math.max(h, SLICER_MIN_PANEL_HEIGHT))
      : Array(panelCount).fill(SLICER_MIN_PANEL_HEIGHT)

  const sum = heights.reduce((total, h) => total + h, 0)
  const total = Math.max(containerHeight, sum)
  const sizes = heights.map((h) => (h / sum) * 100)
  // primereact must allow the drag past the floor; the release below clamps it back up
  // and the stack grows instead, so a neighbour never ends up smaller than the minimum
  const minSize = 2

  const handleResizeEnd = (props: { sizes: number[] }) => {
    setStoredHeights(
      props.sizes.map((size) => Math.max((size / 100) * total, SLICER_MIN_PANEL_HEIGHT)),
    )
  }

  // primereact keeps its own sizes after a drag, so the host remounts it on this signature
  const layoutKey = heights.map(Math.round).join('|')

  return { sizes, minSize, height: total, layoutKey, handleResizeEnd }
}

export default useSlicerSplitter
