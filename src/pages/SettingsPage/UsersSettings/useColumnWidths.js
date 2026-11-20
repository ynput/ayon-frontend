import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { isEqual } from 'lodash'
import { useLocalStorage } from '@shared/hooks/useLocalStorage'

// Column widths for the users table. Each column fits its widest cell over every user (not only
// the rows the virtual scroller renders, so widths don't change while scrolling), unless the user
// resized it: that width is kept until they double-click its edge, which fits it again.

const RESIZED_WIDTHS_KEY = 'users-table-column-widths'
const MIN_WIDTH = 40
// the sort arrow a sorted header shows: room for it, so sorting doesn't cut the title
const SORT_ICON_ROOM = 21

// Width of the widest text in px. Only texts close to the longest are measured: measuring every
// text of thousands of users takes long, and a much shorter text is hardly ever wider.
// The canvas font has no letter spacing, so it's added per character.
const widestText = (context, letterSpacing, texts) => {
  let longest = 0
  for (const text of texts) longest = Math.max(longest, text.length)
  let widest = 0
  for (const text of texts) {
    if (text.length < longest * 0.7) continue
    const width = context.measureText(text).width + letterSpacing * text.length
    widest = Math.max(widest, width)
  }
  return widest
}

const getTexts = (rows, getText) => {
  const texts = new Set()
  for (const row of rows) texts.add(String(getText(row) ?? ''))
  return texts
}

// The width a cell needs for its content: a copy of the content, in the cell's font, laid out at
// its natural width inside the table (so the table's own styles apply), plus the cell's padding
// and borders
const naturalWidth = (measurer, element, cell = element) => {
  const style = getComputedStyle(cell)
  measurer.style.font = style.font
  measurer.style.letterSpacing = style.letterSpacing
  measurer.innerHTML = element.innerHTML
  const width = measurer.getBoundingClientRect().width
  measurer.innerHTML = ''
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  return width + cell.offsetWidth - cell.clientWidth + padding
}

/**
 * @param tableRef DataTable ref
 * @param rows every row, not only the filtered ones, so a search doesn't change the widths
 * @param columns `{ [key]: (row) => text of its cell, or null for a cell without text }`, memoized.
 *   Each column needs the class `col-<key>`.
 * @param ready false while the table shows placeholder rows
 * @returns `widths` (`{ [key]: px }`, a column missing until measured), `startResize(key, event)`
 *   for a mouse down on a column's edge, `fitWidth(key)` to drop a column's resized width
 */
export const useColumnWidths = (tableRef, rows, columns, ready) => {
  const [autoWidths, setAutoWidths] = useState({})
  const [resizedWidths, setResizedWidths] = useLocalStorage(RESIZED_WIDTHS_KEY, {})
  // per column: the header's width, and the room a cell needs beside its text (padding, avatar, icon)
  const headers = useRef({})
  const extras = useRef({})
  const measured = useRef({ rows: null, columns: null })
  const canvas = useRef(null)

  // after every render, as the table renders its first rows a render after it gets them. The
  // measured ref stops it from measuring again for the same rows.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!ready || !rows.length) return
    if (measured.current.rows === rows && measured.current.columns === columns) return
    const root = tableRef.current?.getElement()
    const table = tableRef.current?.getTable()
    const firstCell = table?.querySelector('tbody td')
    if (!firstCell) return

    canvas.current ??= document.createElement('canvas')
    const context = canvas.current.getContext('2d')
    const style = getComputedStyle(firstCell)
    context.font = style.font
    const letterSpacing = parseFloat(style.letterSpacing) || 0
    const widest = (texts) => widestText(context, letterSpacing, texts)

    const measurer = document.createElement('div')
    measurer.style.cssText =
      'position: absolute; visibility: hidden; top: 0; left: 0; width: max-content; white-space: nowrap'
    root.appendChild(measurer)

    // the rows on screen, to measure their cells
    const scroller = tableRef.current.getVirtualScroller()
    const first = scroller.getRenderedRange().first
    const renderedRows = [...table.querySelectorAll('tbody tr')]
    const rendered = scroller.props.items.slice(first, first + renderedRows.length)

    const next = {}
    let complete = true
    for (const [key, getText] of Object.entries(columns)) {
      if (!(key in headers.current)) {
        const title = table.querySelector(`thead th.col-${key} .p-column-title`)
        if (title) {
          headers.current[key] = naturalWidth(measurer, title, title.closest('th')) + SORT_ICON_ROOM
        }
      }
      if (!(key in extras.current)) {
        // the cell with the longest text: a cell without text may leave out its icon too
        let index = 0
        let longest = -1
        rendered.forEach((row, i) => {
          const length = getText ? String(getText(row) ?? '').length : 0
          if (length > longest) [index, longest] = [i, length]
        })
        const cell = renderedRows[index]?.querySelector(`td.col-${key}`)
        // a text column whose rendered cells are all empty waits for one with text
        if (cell && (!getText || longest > 0)) {
          const text = getText ? String(getText(rendered[index]) ?? '') : ''
          extras.current[key] = naturalWidth(measurer, cell) - widest([text])
        }
      }
      if (!(key in headers.current) || !(key in extras.current)) complete = false
      const content = (extras.current[key] ?? 0) + (getText ? widest(getTexts(rows, getText)) : 0)
      if (key in headers.current) next[key] = Math.ceil(Math.max(headers.current[key], content))
    }
    measurer.remove()
    if (complete) measured.current = { rows, columns }
    setAutoWidths((previous) => (isEqual(previous, next) ? previous : next))
  })

  // Dragging a column's edge sets its width as a CSS variable on the table, without rendering
  // the table on every move; letting go keeps it
  const startResize = useCallback(
    (key, event) => {
      if (event.button !== 0) return
      // keeps the header from being dragged to reorder the columns, and the text unselected
      event.preventDefault()
      event.stopPropagation()
      const root = tableRef.current?.getElement()
      const header = event.currentTarget.closest('th')
      if (!root || !header) return
      const startX = event.clientX
      const startWidth = header.offsetWidth
      let width = null

      const onMove = (e) => {
        width = Math.max(MIN_WIDTH, Math.round(startWidth + e.clientX - startX))
        root.style.setProperty(`--col-${key}`, `${width}px`)
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.removeProperty('cursor')
        if (width !== null && width !== startWidth) {
          setResizedWidths((previous) => ({ ...previous, [key]: width }))
        }
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.body.style.cursor = 'col-resize'
    },
    [tableRef, setResizedWidths],
  )

  const fitWidth = useCallback(
    (key) => {
      setResizedWidths((previous) => {
        if (!(key in previous)) return previous
        const rest = { ...previous }
        delete rest[key]
        return rest
      })
    },
    [setResizedWidths],
  )

  const widths = { ...autoWidths }
  for (const key in resizedWidths) if (key in columns) widths[key] = resizedWidths[key]

  return { widths, startResize, fitWidth }
}
