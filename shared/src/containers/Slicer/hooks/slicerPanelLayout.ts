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

// spare room is shared out between the expanded panels, and an overgrown stack is squeezed
// back into the column, down to the floors. Only the floors themselves may overflow.
const fitToHeight = (
  stack: number[],
  mins: number[],
  target: number,
  flexible: boolean[],
): number[] => {
  const sum = stack.reduce((total, h) => total + h, 0)
  const count = flexible.filter(Boolean).length
  if (!count || sum === target) return stack

  if (sum < target) {
    const slack = (target - sum) / count
    return stack.map((h, index) => (flexible[index] ? h + slack : h))
  }

  const room = stack.map((h, index) => (flexible[index] ? h - mins[index] : 0))
  const totalRoom = room.reduce((total, r) => total + r, 0)
  if (!totalRoom) return stack

  const excess = sum - target
  return stack.map((h, index) => h - excess * (room[index] / totalRoom))
}

// panels never go below their floor, and the stack only outgrows the column when the
// floors alone do not fit. Stored heights are a preference, not a reservation.
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

  const flexible = panelIds.map((id) => !collapsed.includes(id))
  const minsTotal = mins.reduce((total, min) => total + min, 0)
  // with nothing expanded there is nowhere to put the spare room, and sizes that do not
  // add up to 100% get stretched by the splitter's flex-grow
  const height = flexible.some(Boolean) ? Math.max(containerHeight, minsTotal) : minsTotal
  const heights = fitToHeight(stack, mins, height, flexible)

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
