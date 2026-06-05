import { FC } from 'react'
import * as Styled from './TableFooter.styled'
import { SummaryDistributionItem } from './summaryTypes'
import { colorForValue } from './summaryColor'

type Props = {
  items: SummaryDistributionItem[]
  total: number
}

// Plain breakdown rows; the owning cell wraps them in a popover and decides order.
export const SummaryBreakdown: FC<Props> = ({ items, total }) => (
  <>
    {items.map((item) => {
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
  </>
)
