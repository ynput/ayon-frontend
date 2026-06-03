import { FC, useState } from 'react'
import * as Styled from './TableFooter.styled'
import { SummaryDistributionItem } from './summaryTypes'
import { colorForValue } from './summaryColor'
import { SummaryBreakdown } from './SummaryBreakdown'

type Props = {
  items: SummaryDistributionItem[]
}

export const ProportionBar: FC<Props> = ({ items }) => {
  const [open, setOpen] = useState(false)
  const total = items.reduce((a, i) => a + i.count, 0)
  if (!total) return null

  return (
    <Styled.Clickable
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setOpen((v) => !v)}
    >
      <Styled.Bar>
        {items
          .filter((i) => i.count > 0)
          .map((item) => (
            <Styled.BarSegment
              key={item.value}
              style={{ flex: item.count, backgroundColor: item.color || colorForValue(item.value) }}
            />
          ))}
      </Styled.Bar>
      {open && (
        <SummaryBreakdown items={items} total={total} onClose={() => setOpen(false)} />
      )}
    </Styled.Clickable>
  )
}
