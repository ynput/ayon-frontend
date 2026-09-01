// header plus a few rows; a panel never goes below this, the stack scrolls instead
export const SLICER_MIN_PANEL_HEIGHT = 180
// a collapsed panel is its header and nothing else
export const SLICER_COLLAPSED_PANEL_HEIGHT = 34

export type SlicerPanelHeights = Record<string, number>

export type SlicerPanelLayout = {
  heights: number[]
  mins: number[]
  sizes: number[]
  minSize: number
  height: number
}

export const panelMinHeights = (
  panelIds: string[],
  collapsed: string[] = [],
  minHeight: number = SLICER_MIN_PANEL_HEIGHT,
): number[] =>
  panelIds.map((id) => (collapsed.includes(id) ? SLICER_COLLAPSED_PANEL_HEIGHT : minHeight))

// panels keep the pixel height they were given and never get squeezed below it: the stack
// grows past the column and scrolls instead. Spare room goes to the expanded panels, so
// the dividers always have something to give and take.
export const resolvePanelLayout = (
  stored: SlicerPanelHeights,
  panelIds: string[],
  collapsed: string[] = [],
  containerHeight: number = 0,
  minHeight: number = SLICER_MIN_PANEL_HEIGHT,
): SlicerPanelLayout => {
  if (!panelIds.length) {
    return { heights: [], mins: [], sizes: [], minSize: 2, height: containerHeight }
  }

  const mins = panelMinHeights(panelIds, collapsed, minHeight)
  const stack = panelIds.map((id, index) =>
    collapsed.includes(id) ? mins[index] : Math.max(stored[id] ?? minHeight, minHeight),
  )

  const sum = stack.reduce((total, h) => total + h, 0)
  const expanded = panelIds.filter((id) => !collapsed.includes(id)).length
  // with nothing expanded there is nowhere to put the spare room, and sizes that do not
  // add up to 100% get stretched by the splitter's flex-grow
  const height = expanded ? Math.max(containerHeight, sum) : sum
  const slack = expanded ? (height - sum) / expanded : 0
  const heights = panelIds.map((id, index) =>
    collapsed.includes(id) ? stack[index] : stack[index] + slack,
  )

  return {
    heights,
    mins,
    sizes: heights.map((h) => (h / height) * 100),
    // primereact must allow the drag past the floor; clampDraggedHeights puts it back
    minSize: 2,
    height,
  }
}

export const clampDraggedHeights = (
  sizes: number[],
  totalHeight: number,
  mins: number[],
): number[] => {
  const heights = sizes.map((size, index) => Math.max((size / 100) * totalHeight, mins[index]))

  // a drag redistributes, it does not resize the stack: lifting a panel off its floor takes
  // the difference from the panels that still have room above theirs
  const target = Math.max(
    totalHeight,
    mins.reduce((total, min) => total + min, 0),
  )
  const excess = heights.reduce((total, h) => total + h, 0) - target
  if (excess <= 0) return heights

  const room = heights.map((h, index) => h - mins[index])
  const totalRoom = room.reduce((total, r) => total + r, 0)
  if (!totalRoom) return heights

  return heights.map((h, index) => h - excess * (room[index] / totalRoom))
}
