import { FC, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import type { RowSelectionState } from '@tanstack/react-table'
import type { SliceMap } from '../types'

// icon plus a truncated label; narrower panels show fewer chips, not shorter ones
const CHIP_WIDTH = 96

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
  max-width: ${CHIP_WIDTH}px;
  white-space: nowrap;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

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

  useEffect(() => {
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

  if (!selected.length) return <Chips ref={ref} />

  // leave room for the "+n" when not everything fits
  const fits = Math.max(1, Math.floor((width - 28) / CHIP_WIDTH))
  const shown = selected.slice(0, fits)
  const hidden = selected.length - shown.length

  return (
    <Chips ref={ref}>
      {shown.map((row) => (
        <Chip key={row.id} title={row.label || row.name}>
          {row.img ? (
            <img src={row.img} alt="" />
          ) : (
            row.icon && <Icon icon={row.icon} style={{ color: row.iconColor }} />
          )}
          <span className="label">{row.label || row.name}</span>
        </Chip>
      ))}
      {hidden > 0 && <span>+{hidden}</span>}
    </Chips>
  )
}

export default SlicerPanelSummary
