import { FC, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import type { RowSelectionState } from '@tanstack/react-table'
import type { SliceMap } from '../types'

const Chips = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  overflow: hidden;
  flex: 1;
  min-width: 0;
  color: var(--md-sys-color-outline);
`

const Chip = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  flex-shrink: 0;

  img {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
  }
`

interface SlicerPanelSummaryProps {
  rowSelection: RowSelectionState
  sliceMap: SliceMap
}

export const SlicerPanelSummary: FC<SlicerPanelSummaryProps> = ({ rowSelection, sliceMap }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const selected = Object.keys(rowSelection)
    .filter((id) => rowSelection[id])
    .map((id) => sliceMap.get(id))
    .filter((row) => !!row)

  // assignees carry their avatar as startContent rather than an icon
  const hasGlyph = (row: (typeof selected)[number]) => !!row.icon || !!row.img || !!row.startContent

  // same rule as the search bar filters: more than one value drops to icons, and only
  // where there is an icon to drop to
  const [labelFits, setLabelFits] = useState(true)
  const compact = selected.length > 1 || !labelFits

  const [visible, setVisible] = useState(selected.length)

  const selectionKey = selected.map((row) => row.id).join('|')
  useLayoutEffect(() => {
    setLabelFits(true)
    setVisible(selected.length)
  }, [width, selectionKey])

  // measure what the browser actually laid out rather than guessing at text widths
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !selected.length) return

    const chips = Array.from(el.querySelectorAll<HTMLElement>('[data-chip]'))
    const overflowWidth = el.querySelector<HTMLElement>('[data-overflow]')?.offsetWidth ?? 22
    const fitsWithin = (chip: HTMLElement, limit: number) =>
      chip.offsetLeft - el.offsetLeft + chip.offsetWidth <= limit

    if (selected.length === 1) {
      if (labelFits && chips[0] && !fitsWithin(chips[0], el.clientWidth) && hasGlyph(selected[0])) {
        setLabelFits(false)
      }
      return
    }

    const last = chips[chips.length - 1]
    if (last && fitsWithin(last, el.clientWidth)) return

    const room = el.clientWidth - overflowWidth
    const fitting = chips.filter((chip) => fitsWithin(chip, room)).length
    const next = Math.max(1, fitting)
    if (next !== visible) setVisible(next)
  })

  if (!selected.length) return <Chips ref={ref} />

  const shown = selected.slice(0, visible)
  const hidden = selected.length - shown.length

  return (
    <Chips ref={ref}>
      {shown.map((row) => (
        <Chip key={row.id} data-chip title={row.label || row.name}>
          {row.startContent ??
            (row.img ? (
              <img src={row.img} alt="" />
            ) : (
              row.icon && <Icon icon={row.icon} style={{ color: row.iconColor }} />
            ))}
          {!(compact && hasGlyph(row)) && <span>{row.label || row.name}</span>}
        </Chip>
      ))}
      {hidden > 0 && <span data-overflow>+{hidden}</span>}
    </Chips>
  )
}

export default SlicerPanelSummary
