// header plus a few rows; below this the stack grows and scrolls instead of crushing panels
export const SLICER_MIN_PANEL_HEIGHT = 180

export type SlicerPanelHeights = Record<string, number>

export type SlicerPanelLayout = {
  heights: number[]
  sizes: number[]
  minSize: number
  height: number
}

// stacked slicer panels keep pixel heights, so enlarging one pushes the stack past the
// column height (scrolls) instead of shrinking its neighbours below the minimum
export const resolvePanelLayout = (
  stored: SlicerPanelHeights,
  panelIds: string[],
  containerHeight: number,
  minHeight: number = SLICER_MIN_PANEL_HEIGHT,
): SlicerPanelLayout => {
  if (!panelIds.length) {
    return { heights: [], sizes: [], minSize: 2, height: containerHeight }
  }

  const heights = panelIds.map((id) => Math.max(stored[id] ?? minHeight, minHeight))
  const sum = heights.reduce((total, h) => total + h, 0)

  return {
    heights,
    sizes: heights.map((h) => (h / sum) * 100),
    // primereact must allow the drag past the floor; clampDraggedHeights puts it back
    minSize: 2,
    height: Math.max(containerHeight, sum),
  }
}

export const clampDraggedHeights = (
  sizes: number[],
  totalHeight: number,
  containerHeight: number,
  minHeight: number = SLICER_MIN_PANEL_HEIGHT,
): number[] => {
  const heights = sizes.map((size) => Math.max((size / 100) * totalHeight, minHeight))

  // without this a single drag past the floor would grow the stack permanently: hand the
  // excess back to the panels that still have room above the floor
  const target = Math.max(containerHeight, sizes.length * minHeight)
  const excess = heights.reduce((total, h) => total + h, 0) - target
  if (excess <= 0) return heights

  const room = heights.map((h) => h - minHeight)
  const totalRoom = room.reduce((total, r) => total + r, 0)
  if (!totalRoom) return heights

  return heights.map((h, index) => h - excess * (room[index] / totalRoom))
}
