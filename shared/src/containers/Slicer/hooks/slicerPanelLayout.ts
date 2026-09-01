// header plus a few rows; a panel never goes below this, the stack scrolls instead
export const SLICER_MIN_PANEL_HEIGHT = 180
// a collapsed panel is its header and nothing else
export const SLICER_COLLAPSED_PANEL_HEIGHT = 34

export type SlicerPanelHeights = Record<string, number>

export type SlicerPanelLayout = {
  heights: number[]
  sizes: number[]
  minSize: number
  height: number
}

// panels keep the pixel height they were given: the stack is as tall as its panels and
// scrolls when that exceeds the column, rather than squeezing them into the viewport
export const resolvePanelLayout = (
  stored: SlicerPanelHeights,
  panelIds: string[],
  collapsed: string[] = [],
  minHeight: number = SLICER_MIN_PANEL_HEIGHT,
): SlicerPanelLayout => {
  if (!panelIds.length) {
    return { heights: [], sizes: [], minSize: 2, height: 0 }
  }

  const heights = panelIds.map((id) =>
    collapsed.includes(id)
      ? SLICER_COLLAPSED_PANEL_HEIGHT
      : Math.max(stored[id] ?? minHeight, minHeight),
  )
  const height = heights.reduce((total, h) => total + h, 0)

  return {
    heights,
    sizes: heights.map((h) => (h / height) * 100),
    // primereact must allow the drag past the floor; clampDraggedHeights puts it back
    minSize: 2,
    height,
  }
}

export const clampDraggedHeights = (
  sizes: number[],
  totalHeight: number,
  minHeight: number = SLICER_MIN_PANEL_HEIGHT,
): number[] => {
  const heights = sizes.map((size) => Math.max((size / 100) * totalHeight, minHeight))

  // a drag redistributes, it does not resize the stack: lifting a panel off the floor
  // takes the difference from the panels that still have room above theirs
  const target = Math.max(totalHeight, sizes.length * minHeight)
  const excess = heights.reduce((total, h) => total + h, 0) - target
  if (excess <= 0) return heights

  const room = heights.map((h) => h - minHeight)
  const totalRoom = room.reduce((total, r) => total + r, 0)
  if (!totalRoom) return heights

  return heights.map((h, index) => h - excess * (room[index] / totalRoom))
}
