import { $Any } from '@types'

const getAbsoluteSelections = (selections: $Any) =>
  selections.map((selection: $Any) => ({
    start: [
      Math.min(selection?.start?.[0] || -1, selection.end?.[0] || -1),
      Math.min(selection?.start?.[1] || -1, selection.end?.[1] || -1),
    ],
    end: [
      Math.max(selection?.start?.[0] || -1, selection.end?.[0] || -1),
      Math.max(selection?.start?.[1] || -1, selection.end?.[1] || -1),
    ],
  })) as Selection[]

const isSelected = (absoluteSelections: $Any, x: number, y: number) => {
  for (const selection of absoluteSelections) {
    if (selection.start === undefined || selection.end === undefined) {
      continue
    }
    if (
      selection.start[0] <= x &&
      x <= selection.end[0] &&
      selection.start[1] <= y &&
      y <= selection.end[1]
    ) {
      return true
    }
  }

  return false
}

export { getAbsoluteSelections, isSelected }
