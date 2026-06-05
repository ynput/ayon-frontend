import { FC } from 'react'
import * as Styled from './TableFooter.styled'
import { SummaryDistributionItem } from './summaryTypes'
import { colorForValue } from './summaryColor'

type Props = {
  // pre-ordered items; zero-count segments are skipped
  items: SummaryDistributionItem[]
  // max segments drawn in the bar; the rest collapse into one "Others" segment
  maxSegments?: number
}

const OTHERS_COLOR = 'var(--md-sys-color-surface-container-highest)'

export const ProportionBar: FC<Props> = ({ items, maxSegments = 12 }) => {
  const nonEmpty = items.filter((i) => i.count > 0)
  const total = nonEmpty.reduce((a, i) => a + i.count, 0)
  if (!total) return null

  const visible = nonEmpty.slice(0, maxSegments)
  const overflowCount = nonEmpty.slice(maxSegments).reduce((a, i) => a + i.count, 0)

  return (
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
    </Styled.Bar>
  )
}
