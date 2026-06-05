import { FC, useState } from 'react'
import * as Styled from './TableFooter.styled'
import { SummaryDistributionItem, SummaryFillCounts } from './summaryTypes'
import { colorForValue } from './summaryColor'
import { SummaryBreakdown } from './SummaryBreakdown'

type Props = {
  items: SummaryDistributionItem[]
  // max segments drawn in the bar; the rest collapse into one "Others" segment
  // but still appear individually in the clicked breakdown.
  maxSegments?: number
  // adds an empty bar segment + Filled/Empty breakdown rows when set
  counts?: SummaryFillCounts
}

const OTHERS_COLOR = 'var(--md-sys-color-surface-container-highest)'
const EMPTY_COLOR = 'var(--md-sys-color-surface-container-highest)'

export const ProportionBar: FC<Props> = ({ items, maxSegments = 12, counts }) => {
  const [open, setOpen] = useState(false)
  const total = items.reduce((a, i) => a + i.count, 0)
  if (!total) return null

  const sorted = [...items].filter((i) => i.count > 0).sort((a, b) => b.count - a.count)
  const visible = sorted.slice(0, maxSegments)
  const overflowCount = sorted.slice(maxSegments).reduce((a, i) => a + i.count, 0)
  const emptyCount = counts?.notFilled ?? 0

  return (
    <Styled.Clickable onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen((v) => !v)}>
      <Styled.Bar>
        {visible.map((item) => (
          <Styled.BarSegment
            key={item.value}
            style={{ flex: item.count, backgroundColor: item.color || colorForValue(item.value) }}
          />
        ))}
        {overflowCount > 0 && (
          <Styled.BarSegment style={{ flex: overflowCount, backgroundColor: OTHERS_COLOR }} />
        )}
        {emptyCount > 0 && (
          <Styled.BarSegment style={{ flex: emptyCount, backgroundColor: EMPTY_COLOR }} />
        )}
      </Styled.Bar>
      {open && (
        <SummaryBreakdown
          items={sorted}
          total={total}
          counts={counts}
          onClose={() => setOpen(false)}
        />
      )}
    </Styled.Clickable>
  )
}
