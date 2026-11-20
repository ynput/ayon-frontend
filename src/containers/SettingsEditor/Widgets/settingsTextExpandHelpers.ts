// A single-line text input in the flat layout opens over its neighbours when its value
// doesn't fit (see SettingsTemplateText). These measure how wide it needs to be and which
// way it can grow.

export type TextExpansion = {
  /** Where the opened field starts, from where the field sits in its row (negative: further left) */
  left: number
  width: number
  /** The room the field held in the row, kept while it is drawn over its neighbours */
  height: number
}

// the gutter a row keeps free at the edge of its box or panel
const EDGE = 12
// room for the caret after the last character
const CARET_ROOM = 12

let canvas: HTMLCanvasElement | null = null

const MEASURED_PADDING = [
  'paddingLeft',
  'paddingRight',
  'borderLeftWidth',
  'borderRightWidth',
] as const

/** The width an input needs to show its whole value, from its own font and insets */
const getNeededWidth = (input: HTMLInputElement) => {
  if (!canvas) canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 0
  const style = getComputedStyle(input)
  // the font shorthand reads back empty in some browsers: build it from its parts
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const letterSpacing = parseFloat(style.letterSpacing) || 0
  const text = context.measureText(input.value).width + letterSpacing * input.value.length
  const insets = MEASURED_PADDING.reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0)
  return Math.ceil(text + insets + CARET_ROOM)
}

/**
 * How a field that doesn't fit opens: it keeps its left edge and grows to the right up to
 * the edge of its box (a list item) or panel, and slides left only as far as it must to
 * keep inside it. It is as wide as its value needs, or as wide as the box allows.
 * Null when it fits.
 */
export const getTextExpansion = (
  wrapper: HTMLElement,
  input: HTMLInputElement,
): TextExpansion | null => {
  const own = wrapper.getBoundingClientRect()
  const needed = getNeededWidth(input)
  if (needed <= own.width) return null

  const bounds = wrapper.closest('.settings-array-item, .settings-panel')?.getBoundingClientRect()
  const min = bounds ? bounds.left + EDGE : own.left
  const max = bounds ? bounds.right - EDGE : own.left + needed
  const width = Math.max(own.width, Math.min(needed, max - min))
  const left = Math.max(min, Math.min(own.left, max - width))
  return { left: left - own.left, width, height: own.height }
}

export const isSameExpansion = (a: TextExpansion | null, b: TextExpansion | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.height === b.height &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.left - b.left) < 1)
