import { FC, useEffect, useRef } from 'react'
import * as Styled from './TableFooter.styled'
import { SummaryDistributionItem, SummaryFillCounts } from './summaryTypes'
import { colorForValue } from './summaryColor'

type Props = {
  items: SummaryDistributionItem[]
  total: number
  // when the column has empty rows, a Filled/Empty footer is appended
  counts?: SummaryFillCounts
  onClose: () => void
}

// Click-opened breakdown popover shared by enum/tags/assignee summary cells.
export const SummaryBreakdown: FC<Props> = ({ items, total, counts, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const sorted = [...items].sort((a, b) => b.count - a.count)

  const filled = counts?.filled
  const notFilled = counts?.notFilled
  // filled/empty only matters when something is actually empty
  const showCounts = notFilled != null && notFilled > 0
  const rowTotal = (filled ?? 0) + (notFilled ?? 0)
  const rowPct = (count: number) =>
    rowTotal ? Math.round((count / rowTotal) * 1000) / 10 : 0

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
      {showCounts && (
        <>
          <Styled.SelectorDivider />
          {filled != null && (
            <Styled.BreakdownItem>
              <span
                className="swatch"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              />
              <span className="name">Filled</span>
              <span className="count">{filled}</span>
              <span className="pct">{rowPct(filled)}%</span>
            </Styled.BreakdownItem>
          )}
          <Styled.BreakdownItem>
            <span
              className="swatch"
              style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)' }}
            />
            <span className="name">Empty</span>
            <span className="count">{notFilled}</span>
            <span className="pct">{rowPct(notFilled)}%</span>
          </Styled.BreakdownItem>
        </>
      )}
    </Styled.Popover>
  )
}
