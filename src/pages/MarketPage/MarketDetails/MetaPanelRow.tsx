import { HTMLAttributes } from 'react'
import * as Styled from './MarketDetails.styled'
import clsx from 'clsx'
import Type from '@/theme/typography.module.css'

interface MetaPanelRowProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  valueDirection?: 'column' | 'row'
}

const MetaPanelRow = ({
  label,
  children,
  valueDirection = 'column',
  ...props
}: MetaPanelRowProps) => (
  <Styled.MetaPanelRow {...props}>
    <span className={clsx('label', Type.titleMedium)}>{label}</span>
    <span
      className="value"
      style={{
        flexDirection: valueDirection,
        alignItems: valueDirection === 'column' ? 'flex-start' : 'center',
        gap: valueDirection === 'column' ? '0' : 8,
      }}
    >
      {children}
    </span>
  </Styled.MetaPanelRow>
)

export default MetaPanelRow
