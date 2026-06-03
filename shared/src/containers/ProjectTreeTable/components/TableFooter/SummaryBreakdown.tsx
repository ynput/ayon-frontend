import { FC, useEffect, useRef } from 'react'
import * as Styled from './TableFooter.styled'
import { SummaryDistributionItem } from './summaryTypes'
import { colorForValue } from './summaryColor'

type Props = {
  items: SummaryDistributionItem[]
  total: number
  onClose: () => void
}

// Click-opened breakdown popover shared by enum/tags/assignee summary cells.
export const SummaryBreakdown: FC<Props> = ({ items, total, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const sorted = [...items].sort((a, b) => b.count - a.count)

  return (
    <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
      {sorted.map((item) => {
        const pct = total ? Math.round((item.count / total) * 1000) / 10 : 0
        return (
          <Styled.BreakdownItem key={item.value}>
            <span
              className="swatch"
              style={{ backgroundColor: item.color || colorForValue(item.value) }}
            />
            <span className="name">{item.label || item.fullName || item.value}</span>
            <span className="count">{item.count}</span>
            <span className="pct">{pct}%</span>
          </Styled.BreakdownItem>
        )
      })}
    </Styled.Popover>
  )
}
