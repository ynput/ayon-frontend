import { useLayoutEffect, useRef, useState } from 'react'
import { isEqual } from 'lodash'

// The table sizes its columns to the rows it renders. With the virtual scroller those are only the
// rows around the view, so the columns changed width while scrolling. This sizes them to every
// row's text instead, like the table did when it rendered every row.

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

/**
 * Column widths that fit every row, for the `style.width` of each column.
 * A column the user resized keeps that width: the table's resize styles override these.
 *
 * @param tableRef DataTable ref
 * @param rows every row, not only the filtered ones, so a search doesn't change the widths
 * @param columns `{ [key]: (row) => text of its cell }`, memoized. Each column needs the class `col-<key>`.
 * @param ready false while the table shows placeholder rows
 * @returns `{ [key]: width in px }`, empty until the first rows are rendered
 */
export const useStableColumnWidths = (tableRef, rows, columns, ready) => {
  const [widths, setWidths] = useState({})
  // per column, the space a cell needs next to its text: padding, avatar, icon
  const extras = useRef({})
  const measured = useRef({ rows: null, columns: null })
  const canvas = useRef(null)

  // after every render, as the table renders its first rows a render after it gets them. The
  // measured ref stops it from measuring again for the same rows.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!ready || !rows.length) return
    if (measured.current.rows === rows && measured.current.columns === columns) return
    const table = tableRef.current?.getTable()
    const cell = table?.querySelector('tbody td')
    if (!cell) return

    canvas.current ??= document.createElement('canvas')
    const context = canvas.current.getContext('2d')
    const style = getComputedStyle(cell)
    context.font = style.font
    const letterSpacing = parseFloat(style.letterSpacing) || 0
    const widest = (texts) => widestText(context, letterSpacing, texts)

    const next = {}
    let complete = true
    for (const [key, getText] of Object.entries(columns)) {
      if (!(key in extras.current)) {
        const header = table.querySelector(`thead th.col-${key}`)
        if (!header) {
          complete = false
          continue
        }
        // not given a width yet, so it fits the rendered rows: compare it with their widest text
        const scroller = tableRef.current.getVirtualScroller()
        const first = scroller.getRenderedRange().first
        const count = table.querySelectorAll('tbody tr').length
        const rendered = scroller.props.items.slice(first, first + count)
        extras.current[key] = header.offsetWidth - widest(getTexts(rendered, getText))
      }
      next[key] = Math.ceil(extras.current[key] + widest(getTexts(rows, getText)))
    }
    if (complete) measured.current = { rows, columns }
    setWidths((previous) => (isEqual(previous, next) ? previous : next))
  })

  return widths
}
