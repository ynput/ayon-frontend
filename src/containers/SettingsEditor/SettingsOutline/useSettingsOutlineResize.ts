import { KeyboardEvent, PointerEvent, RefObject, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '@shared/hooks'

export const OUTLINE_MIN_WIDTH = 120
const KEY_STEP = 16

// read by the grid around the rail (SettingsEditor.sass), so they are set there
const WIDTH_PROPERTY = '--settings-outline-width'
const SHIFT_PROPERTY = '--settings-outline-shift'
const RESIZED_ATTRIBUTE = 'data-outline-resized'

/**
 * A width dragged by the user. `shift` moves a centred sheet off centre, so the rail keeps its
 * left edge as it widens (only where the margin has room for it)
 */
type OutlineSize = { width: number; shift: number }

/** The grid's sizes, set once in SettingsEditor.sass (.settings-flat-layout) */
const readLayout = (grid: HTMLElement) => {
  const style = getComputedStyle(grid)
  const px = (name: string) => parseFloat(style.getPropertyValue(name)) || 0
  return {
    sheetWidth: px('--settings-sheet-width'),
    gap: px('--settings-layout-gap'),
    maxWidth: px('--settings-outline-max-width') || OUTLINE_MIN_WIDTH,
  }
}

const clampWidth = (width: number, maxWidth: number) =>
  Math.round(Math.min(maxWidth, Math.max(OUTLINE_MIN_WIDTH, width)))

const readSize = (value: unknown): OutlineSize | null => {
  const size = value as Partial<OutlineSize> | null
  if (!size || typeof size.width !== 'number' || !Number.isFinite(size.width)) return null
  const shift = typeof size.shift === 'number' && Number.isFinite(size.shift) ? size.shift : 0
  return { width: Math.round(size.width), shift: Math.round(shift) }
}

const applySize = (grid: HTMLElement, size: OutlineSize | null) => {
  if (!size) {
    grid.style.removeProperty(WIDTH_PROPERTY)
    grid.style.removeProperty(SHIFT_PROPERTY)
    grid.removeAttribute(RESIZED_ATTRIBUTE)
    return
  }
  const width = clampWidth(size.width, readLayout(grid).maxWidth)
  grid.style.setProperty(WIDTH_PROPERTY, `${width}px`)
  grid.style.setProperty(SHIFT_PROPERTY, `${size.shift}px`)
  grid.setAttribute(RESIZED_ATTRIBUTE, '')
}

type Start = {
  width: number
  maxWidth: number
  shift: number
  centre: number
  mode: 'full' | 'margin' | 'edge'
}

/**
 * Where a resize starts from. `centre` is the rail's column in a centred sheet, the margin. A
 * rail with room on its left (`margin`) keeps its left edge, one at the grid's edge grows from it
 */
const getStart = (outline: HTMLElement, grid: HTMLElement, stored: OutlineSize | null): Start => {
  const width = outline.getBoundingClientRect().width
  const shift = stored?.shift ?? 0
  const { sheetWidth, gap, maxWidth } = readLayout(grid)
  const centre = (grid.clientWidth - sheetWidth - 2 * gap) / 2
  const start = { width, maxWidth, shift, centre }
  if (grid.matches('.is-full-width')) return { ...start, mode: 'full' }
  return { ...start, mode: centre + shift >= width ? 'margin' : 'edge' }
}

/** The size after moving the line by `dx`: the line follows it until the width's limits */
const resizeBy = (start: Start, dx: number): OutlineSize => {
  const width = clampWidth(start.width + dx, start.maxWidth)
  if (start.mode === 'full') return { width, shift: start.shift }
  if (start.mode === 'margin')
    return { width, shift: Math.round(start.shift + width - start.width) }
  // at the grid's edge the column is the width, as long as the shift asks for no more
  return { width, shift: Math.round(Math.min(start.shift, width - start.centre)) }
}

/**
 * The outline's width, set by dragging the line between it and the sheet (or the arrow keys on
 * it), remembered across pages and visits. Null is the default width, the user's choice in
 * Profile. Double-click goes back to it.
 */
export const useSettingsOutlineResize = (outlineRef: RefObject<HTMLElement>, active: boolean) => {
  const [stored, setStored] = useLocalStorage<OutlineSize | null>('settings-outline-size', null)
  const size = readSize(stored)
  // the rail's drawn width and cap, for the handle's aria values (they follow a drag too)
  const [shown, setShown] = useState<{ width: number; maxWidth: number }>()
  const [resizing, setResizing] = useState(false)
  const dragRef = useRef<{ x: number; start: Start; size: OutlineSize | null } | null>(null)
  const frameRef = useRef(0)

  const { width, shift } = size ?? {}
  useEffect(() => {
    const grid = outlineRef.current?.parentElement
    if (!active || !grid) return
    applySize(grid, width === undefined ? null : { width, shift: shift ?? 0 })
    return () => applySize(grid, null)
  }, [active, outlineRef, width, shift])

  useEffect(() => {
    const outline = outlineRef.current
    const grid = outline?.parentElement
    if (!active || !outline || !grid) return
    const observer = new ResizeObserver(() =>
      setShown({
        width: Math.round(outline.getBoundingClientRect().width),
        maxWidth: readLayout(grid).maxWidth,
      }),
    )
    observer.observe(outline)
    return () => observer.disconnect()
  }, [active, outlineRef])

  // a rail that goes mid-drag (the sheet changed, the page left) leaves no cursor or frame behind
  useEffect(
    () => () => {
      cancelAnimationFrame(frameRef.current)
      if (dragRef.current) document.body.style.removeProperty('cursor')
    },
    [],
  )

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    const outline = outlineRef.current
    const grid = outline?.parentElement
    if (e.button !== 0 || !outline || !grid) return
    // no text selection while dragging
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, start: getStart(outline, grid, size), size: null }
    document.body.style.cursor = 'col-resize'
    setResizing(true)
  }

  // sets the grid straight away, once a frame, and saves once the drag ends
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    const grid = outlineRef.current?.parentElement
    if (!drag || !grid) return
    drag.size = resizeBy(drag.start, e.clientX - drag.x)
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => drag.size && applySize(grid, drag.size))
  }

  const endDrag = () => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    cancelAnimationFrame(frameRef.current)
    document.body.style.removeProperty('cursor')
    setResizing(false)
    if (drag.size) {
      const grid = outlineRef.current?.parentElement
      if (grid) applySize(grid, drag.size)
      setStored(drag.size)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const outline = outlineRef.current
    const grid = outline?.parentElement
    const step = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[e.key]
    if (!outline || !grid || !step) return
    e.preventDefault()
    setStored(resizeBy(getStart(outline, grid, size), step))
  }

  return {
    resizing,
    width: shown?.width ?? width,
    maxWidth: shown?.maxWidth,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onLostPointerCapture: endDrag,
      onKeyDown,
      onDoubleClick: () => setStored(null),
    },
  }
}
