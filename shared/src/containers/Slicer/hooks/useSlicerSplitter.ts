import { useState } from 'react'
import { useSessionStorage } from '@shared/hooks/useSessionStorage'
import { clampDraggedHeights, resolvePanelLayout } from './slicerPanelLayout'
import type { SlicerPanelHeights } from './slicerPanelLayout'

export const SLICER_SPLITTER_STATE_KEY = 'slicer-splitter'
export const SLICER_SPLITTER_PANEL_CONFIG = {
  minSize: 2,
  size: 12,
}

// Splitter sizes are percentages: the default sidebar is about 240px wide, enough for its header
// and most names, whatever the window width.
const SIDEBAR_DEFAULT_WIDTH = 240
export const getSidebarDefaultSize = () => {
  const width = typeof window === 'undefined' ? 0 : window.innerWidth
  if (!width) return SLICER_SPLITTER_PANEL_CONFIG.size
  return Math.min(
    25,
    Math.max(SLICER_SPLITTER_PANEL_CONFIG.size, (SIDEBAR_DEFAULT_WIDTH / width) * 100),
  )
}

const useSlicerSplitter = () => {
  const defaultSize = getSidebarDefaultSize()
  const [slicerSize, setSlicerSize] = useSessionStorage<number[]>(SLICER_SPLITTER_STATE_KEY, [
    defaultSize,
    100 - defaultSize,
  ])

  const handleResizeEnd = (props: { sizes: number[] }) => {
    setSlicerSize(props.sizes)
  }

  return [slicerSize, handleResizeEnd] as const
}

export {
  SLICER_DEFAULT_PANEL_HEIGHT,
  SLICER_MIN_PANEL_HEIGHT,
  resolvePanelLayout,
  clampDraggedHeights,
} from './slicerPanelLayout'

export const useSlicerPanelHeights = (
  page: string,
  panelIds: string[],
  collapsed: string[] = [],
  containerHeight: number = 0,
) => {
  const [stored, setStoredHeights] = useSessionStorage<SlicerPanelHeights>(
    `slicer-panel-heights-${page}`,
    {},
  )
  // primereact keeps its own sizes after a drag, so a clamped drag has to remount it
  const [clampCount, setClampCount] = useState(0)

  const heights = Array.isArray(stored) ? {} : stored
  const {
    sizes,
    mins,
    minSize,
    height,
    heights: panelHeights,
  } = resolvePanelLayout(heights, panelIds, collapsed, containerHeight)

  const handleResizeEnd = (props: { sizes: number[] }) => {
    const dragged = clampDraggedHeights(props.sizes, height, mins)
    // a collapsed panel has no height of its own to remember
    setStoredHeights({
      ...heights,
      ...Object.fromEntries(
        panelIds
          .map((id, index) => [id, dragged[index]] as const)
          .filter(([id]) => !collapsed.includes(id)),
      ),
    })
    const clamped = dragged.some(
      (h, index) => Math.abs(h - (props.sizes[index] / 100) * height) > 1,
    )
    if (clamped) setClampCount((count) => count + 1)
  }

  return {
    sizes,
    minSize,
    height,
    panelHeights,
    layoutKey: `${panelIds.join('|')}#${collapsed.join('|')}#${clampCount}`,
    handleResizeEnd,
  }
}

export default useSlicerSplitter
